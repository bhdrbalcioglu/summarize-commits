import axios from "axios";
import { useAiResponseStore } from "../stores/aiResponse";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Constants for batching and concurrency
const MAX_TOKENS_PER_REQUEST = 4000; // Model's maximum token limit
const SAFETY_MARGIN = 500; // Reserve tokens for response and overhead
const MAX_INPUT_TOKENS = MAX_TOKENS_PER_REQUEST - SAFETY_MARGIN;
const MAX_CONCURRENT_REQUESTS = 5; // Adjust based on your API rate limits

// Function to estimate tokens
function estimateTokens(text: string): number {
  // Approximate tokens by assuming an average of 4 characters per token
  return Math.ceil(text.length / 4);
}

// Semaphore for concurrency control
class Semaphore {
  private tasks: (() => void)[] = [];
  private counter: number;

  constructor(maxConcurrency: number) {
    this.counter = maxConcurrency;
  }

  acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.counter > 0) {
        this.counter--;
        resolve();
      } else {
        this.tasks.push(resolve);
      }
    });
  }

  release() {
    this.counter++;
    if (this.tasks.length > 0) {
      const nextTask = this.tasks.shift();
      if (nextTask) {
        this.counter--;
        nextTask();
      }
    }
  }
}

// Helper functions
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emptyString(): string {
  return "";
}

// Batch creation function for commits
function createCommitBatches(commitBundles: any[]): any[][] {
  const batches = [];
  let currentBatch = [];
  let currentBatchSize = 0;

  for (const commit of commitBundles) {
    const commitSize = estimateTokens(JSON.stringify(commit));

    if (currentBatchSize + commitSize > MAX_INPUT_TOKENS) {
      batches.push(currentBatch);
      currentBatch = [commit];
      currentBatchSize = commitSize;
    } else {
      currentBatch.push(commit);
      currentBatchSize += commitSize;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// Analyze a single batch of commits
async function analyzeBatch(batch: any[], retries = 3): Promise<any[]> {
  try {
    const prompt = `You are an expert software engineer and project analyst. Your task is to analyze a set of code changes (diffs) from a software repository. These changes include file names and the actual code diffs.

For each code change, please:

1. **Describe the Change**: Provide a brief summary of what was changed in the code, focusing on the functionality affected.

2. **Categorize the Change**: Determine whether the change is a:
   - **Bug Fix**
   - **Improvement**
   - **New Feature**
   - **Refactoring**
   - **Documentation Update**
   - **Other** (specify)

3. **Identify the Affected Areas**: Mention the parts of the application or modules that are affected by the change.

4. **Infer Programming Language or Framework**: If possible, infer and mention the programming language or framework used based on the file extensions and code syntax.

Always add the Commit Message at the top of each commit bundle. This will ensure the user can understand the changes in each commit.
For each code change, please provide the following in JSON format:

{
  "commitMessage": "Commit message here",
  "commitID": "Commit ID here",
  "description": "Brief summary of the change",
  "category": "One of Bug Fix, Improvement, New Feature, Refactoring, Documentation Update, Other",
  "affectedAreas": ["List of affected modules or areas"],
  "languageOrFramework": "Inferred programming language or framework"
}

Please output the results as a JSON array without additional text. This is really important because the next step will be to parse this JSON array.

Please do not include any additional text or formatting.


**Here are the code changes to analyze:**

${JSON.stringify(batch)}`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const analysisResultText = response.data.choices[0].message?.content.trim();

    // Parse the JSON output
    const analysisResult = JSON.parse(analysisResultText);
    return analysisResult; // This should be an array of analysis objects
  } catch (error) {
    if (retries > 0) {
      await wait(2 ** (3 - retries) * 1000); // Exponential backoff
      return analyzeBatch(batch, retries - 1);
    } else {
      console.error("Failed to analyze batch after retries:", error);
      return [];
    }
  }
}

// Process commit batches concurrently
async function processCommitBatches(batches: any[][]): Promise<any[]> {
  const batchPromises = [];
  const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

  for (const batch of batches) {
    const batchPromise = semaphore.acquire().then(async () => {
      try {
        const analysis = await analyzeBatch(batch);
        return analysis;
      } finally {
        semaphore.release();
      }
    });
    batchPromises.push(batchPromise);
  }

  const results = await Promise.all(batchPromises);
  // Flatten the array of arrays
  return results.flat();
}

// Function to analyze diffs with batching
export const analyzeDiffs = async (commitBundles: any[]): Promise<any[]> => {
  console.log("Entered analyzeDiffs");
  try {
    const batches = createCommitBatches(commitBundles);
    const analysisResults = await processCommitBatches(batches);

    const aiResponseStore = useAiResponseStore();
    aiResponseStore.setAiResponseFirst(
      JSON.stringify(analysisResults, null, 2)
    );
    console.log("Exiting analyzeDiffs");
    return analysisResults; // Return aggregated analysis results
  } catch (error) {
    console.error("Error analyzing diffs:", error);
    throw error;
  }
};

// Function to generate update notes
export const generateUpdateNotes = async (
  allAnalysisResults: any[]
): Promise<string> => {
  console.log("Entered generateUpdateNotes");
  const aiResponseStore = useAiResponseStore();
  try {
    // Group analysis results by category
    const groupedByCategory: { [key: string]: any[] } = {
      "New Feature": [],
      Improvement: [],
      "Bug Fix": [],
      Refactoring: [],
      "Documentation Update": [],
      Other: [],
    };

    for (const analysis of allAnalysisResults) {
      const category = analysis.category || "Other";
      if (!groupedByCategory[category]) {
        groupedByCategory[category] = [];
      }
      groupedByCategory[category].push(analysis);
    }

    // Prepare the final prompt
    const prompt = `You are a technical writer tasked with creating clear and concise update notes for end-users based on the provided analysis of code changes.

**Instructions:**

- Use simple language that is easily understandable by non-technical users.
- Only include the updates that are relevant to the end-users. Do not include the updates that are only relevant to the developers.
- Organize the updates under the following sections, if applicable:
  - **New Features**
  - **Improvements**
  - **Fixed Bugs**
(Note: Not necessarily all of these sections will be used, it depends on the analysis result)
- List each update as a bullet point under the appropriate section.
- Avoid technical jargon and focus on the benefits or changes that users will notice.
- Write the update notes in vague, general terms, so that the user will not be able to understand the details of the code changes. (This is important for security reasons)
- Do not include the details of the code changes in the update notes.
- Do not include the names of the files that were changed in the update notes.
- Do not include the commit messages in the update notes.
- Please output the results in ${aiResponseStore.outputLanguage}. 

**Here is the aggregated analysis of code changes:**

${JSON.stringify(allAnalysisResults)}

**Please generate the update notes accordingly.**`;

    // Check if the prompt exceeds the token limit
    if (estimateTokens(prompt) > MAX_INPUT_TOKENS) {
      // If the prompt is too large, we need to batch the update note generation
      // For simplicity, we can generate update notes per category and then combine them

      let finalUpdateNotes = "## Update Notes\n";

      const categoriesToProcess = ["New Feature", "Improvement", "Bug Fix"];

      for (const category of categoriesToProcess) {
        const analyses = groupedByCategory[category];
        if (analyses && analyses.length > 0) {
          const aiResponseStore = useAiResponseStore();
        
          const categoryPrompt = `You are a technical writer tasked with creating clear and concise update notes for end-users based on the provided analysis of code changes.

**Instructions:**

- Use simple language that is easily understandable by non-technical users.
- Only include the updates that are relevant to the end-users. Do not include the updates that are only relevant to the developers.
- Under the section **${
            category === "Bug Fix" ? "Fixed Bugs" : category + "s"
          }**, list each update as a bullet point.
- Avoid technical jargon and focus on the benefits or changes that users will notice.
- Write the update notes in vague, general terms, so that the user will not be able to understand the details of the code changes.
- Do not include the details of the code changes in the update notes.
- Do not include the names of the files that were changed in the update notes.
- Do not include the commit messages in the update notes.
- Please output the results in ${aiResponseStore.outputLanguage}.
**Here is the analysis of code changes:**

${JSON.stringify(analyses)}

**Please generate the update notes accordingly.**`;

          const response = await axios.post(
            OPENAI_API_URL,
            {
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: categoryPrompt }],
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
            }
          );

          const updateNotes = response.data.choices[0].message?.content.trim();

          finalUpdateNotes += `\n\n${updateNotes}`;
        }
      }

      // Store the final update notes
     
      aiResponseStore.setAiResponseSecond(finalUpdateNotes);
      console.log("Exiting generateUpdateNotes");
      return finalUpdateNotes;
    } else {
      // If the prompt size is acceptable, proceed with a single API call
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const updateNotes = response.data.choices[0].message?.content.trim();

      // Store the final update notes
      const aiResponseStore = useAiResponseStore();
      aiResponseStore.setAiResponseSecond(updateNotes || "");
      console.log("Exiting generateUpdateNotes");
      return updateNotes || "";
    }
  } catch (error) {
    console.error("Error generating update notes:", error);
    throw error;
  }
};

// Main function to generate commit message
export const generateCommitMessage = async (commitBundles: any[]) => {
  try {
    const analysisResults = await analyzeDiffs(commitBundles);
    const updateNotes = await generateUpdateNotes(analysisResults);
    return updateNotes;
  } catch (error) {
    console.error("Error generating commit message:", error);
    throw error;
  }
};
