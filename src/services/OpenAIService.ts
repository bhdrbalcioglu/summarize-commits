import axios from "axios";
import { useAiResponseStore } from "../stores/aiResponse";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Function to analyze diffs
export const analyzeDiffs = async (commitBundles: any) => {
  console.log("analyzeDiffs Girdi");
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
    
  **Here are the code changes to analyze:**
  
  ${JSON.stringify(commitBundles)}`;

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

    const analysisResult = response.data.choices[0].message?.content.trim();
    const aiResponseStore = useAiResponseStore();
    aiResponseStore.setAiResponseFirst(analysisResult);
    console.log("analyzeDiffs Çıktı", analysisResult);
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing diffs:", error);
    throw error;
  }
};

export const generateUpdateNotes = async (analysisResult: any) => {
  console.log("generateUpdateNotes Girdi");
  try {
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
  

  **Here is the analysis of code changes:**
  
  ${JSON.stringify(analysisResult)}
  
  **Please generate the update notes accordingly.**`;

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
    console.log("generateUpdateNotes Çıktı");
    const aiResponseStore = useAiResponseStore();
    aiResponseStore.setAiResponseSecond(updateNotes);
    return updateNotes;
  } catch (error) {
    console.error("Error generating update notes:", error);
    throw error;
  }
};

export const generateCommitMessage = async (commitBundles: any) => {
  const analysisResult = await analyzeDiffs(commitBundles);
  const updateNotes = await generateUpdateNotes(analysisResult);
  return updateNotes;
};
