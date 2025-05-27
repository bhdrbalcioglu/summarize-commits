// backend/src/services/openAIService.ts
import axios, { AxiosError } from "axios";
import { environment } from "../config/index.js";
import {
  AISummarizationService,
  BackendAnalysisRequest,
  BackendAnalysisResponse,
  BackendUpdateNotesRequest,
  BackendUpdateNotesResponse,
  SingleCommitAnalysis,
} from "../types/ai.types.js";
import { BackendCommitBundleItem } from "../types/git.types.js";
import {
  BASE_ANALYSIS_PROMPT,
  BASE_UPDATE_NOTES_PROMPT,
} from "../prompts/aiPrompts.js";

// --- Constants & Helpers ---
const MAX_TOKENS_PER_REQUEST = 4000;
const SAFETY_MARGIN = 500;
const MAX_INPUT_TOKENS = MAX_TOKENS_PER_REQUEST - SAFETY_MARGIN;
const MAX_CONCURRENT_REQUESTS = 5;

// Helper function to estimate tokens (simplified)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Semaphore class to limit concurrency
class Semaphore {
  private count: number;
  private queue: (() => void)[] = [];

  constructor(maxConcurrency: number) {
    this.count = maxConcurrency;
  }

  acquire(): Promise<void> {
    // This is line 34 in the provided error context (approx.)
    return new Promise<void>((resolve) => {
      // Ensure this 'return' is present
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      if (nextResolve) {
        // The slot is immediately passed to the next waiting task.
        // 'count' was already decremented by the acquire that's now being resolved.
        // Or, if we consider 'count' as total permits, release adds one, acquire takes one.
        // Let's use a model where count is "available permits"
        // release() always increases available permits, unless someone takes it from queue.
        nextResolve(); // This resolve doesn't change 'count', its corresponding acquire did.
      }
    } else {
      this.count++; // No one waiting, so increment available permits.
    }
    // Ensure count does not exceed maxConcurrency if there's a logic flaw elsewhere
    // For this simple semaphore, this.count should naturally stay <= maxConcurrency
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createCommitBatchesForAnalysis(
  commitBundle: BackendCommitBundleItem[]
): BackendCommitBundleItem[][] {
  const batches: BackendCommitBundleItem[][] = [];
  let currentBatch: BackendCommitBundleItem[] = [];
  let currentBatchTokenSize = 0;

  for (const commit of commitBundle) {
    const commitSize = estimateTokens(JSON.stringify(commit));
    if (
      currentBatchTokenSize + commitSize > MAX_INPUT_TOKENS &&
      currentBatch.length > 0
    ) {
      batches.push(currentBatch);
      currentBatch = [commit]; // Start new batch with current commit
      currentBatchTokenSize = commitSize;
    } else if (commitSize > MAX_INPUT_TOKENS) {
      // Single commit too large
      if (currentBatch.length > 0) {
        batches.push(currentBatch); // Push previous batch
        currentBatch = []; // Reset for safety, though this commit forms its own batch
        currentBatchTokenSize = 0;
      }
      console.warn(
        `Warning: Single commit ${commit.commit_id} estimated at ${commitSize} tokens exceeds MAX_INPUT_TOKENS ${MAX_INPUT_TOKENS}. It will be processed alone but may fail if too large for the AI model.`
      );
      batches.push([commit]); // Add as its own batch
    } else {
      // Add to current batch
      currentBatch.push(commit);
      currentBatchTokenSize += commitSize;
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  return batches;
}

// This is line 81 in the provided error context (approx.)
async function processBatchesConcurrently<T, R>(
  batches: T[][], // Array of batches, where each batch is an array of items T
  processor: (batch: T[], ...args: any[]) => Promise<R[]>, // Function that processes a batch and returns Promise<R[]>
  ...processorArgs: any[] // Additional arguments to pass to the processor function
): Promise<R[]> {
  // This function must return a Promise<R[]>
  const allResults: R[] = [];
  const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

  const batchPromises: Promise<void>[] = batches.map(async (batch) => {
    await semaphore.acquire();
    try {
      const batchResult = await processor(batch, ...processorArgs);
      allResults.push(...batchResult); // Collect results
    } catch (error) {
      console.error("Error processing a batch concurrently:", error);
      // Decide on error handling: rethrow, collect errors, or push partial results
      // For now, we'll let errors propagate if not caught by the processor itself
      // Or, to ensure all batches are attempted:
      // throw error; // This would stop Promise.all if one batch fails
    } finally {
      semaphore.release();
    }
  });

  // Wait for all processing to complete (or fail)
  // If a batchPromise rejects, Promise.all will reject.
  try {
    await Promise.all(batchPromises);
  } catch (error) {
    console.error(
      "An error occurred in one or more concurrent batch processes:",
      error
    );
    // Depending on requirements, you might want to return partial results or rethrow
    // return allResults; // Return partial results if desired even on error
    throw error; // Rethrow the first error encountered by Promise.all
  }

  return allResults; // Return the aggregated results
}

class OpenAIService implements AISummarizationService {
  private apiKey: string;
  private apiUrl = "https://api.openai.com/v1/chat/completions";

  constructor() {
    this.apiKey = environment.openaiApiKey;
    if (!this.apiKey) {
      console.error(
        "OpenAI API Key is not configured. AI features will not work."
      );
      // Consider throwing: throw new Error("OpenAI API Key is not configured.");
    }
  }

  private async analyzeSingleBatch(
    batch: BackendCommitBundleItem[],
    userContextPrompt: string | undefined, // Kept for potential future use, though not in current interface for analyzeCommits
    targetLanguage: string,
    retries = 3
  ): Promise<SingleCommitAnalysis[]> {
    if (!this.apiKey) throw new Error("OpenAI API key is not configured.");

    const fullPrompt = `${BASE_ANALYSIS_PROMPT}
${userContextPrompt ? `Additional user context: ${userContextPrompt}` : ""}
Output language: ${targetLanguage}.
Code changes to analyze:
${JSON.stringify(batch)}`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fullPrompt }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      const content = response.data.choices[0].message?.content?.trim();
      if (!content)
        throw new Error("OpenAI returned empty content for analysis.");
      try {
        return JSON.parse(content) as SingleCommitAnalysis[];
      } catch (parseError) {
        console.error(
          "Failed to parse OpenAI JSON response for analysis:",
          content,
          parseError
        );
        throw new Error("OpenAI returned malformed JSON for analysis.");
      }
    } catch (error: any) {
      const axiosError = error as AxiosError;
      if (retries > 0 && axiosError.response?.status === 429) {
        const delay = Math.pow(2, 3 - retries + 1) * 1000;
        console.log(`OpenAI rate limit hit. Retrying in ${delay / 1000}s...`);
        await wait(delay);
        return this.analyzeSingleBatch(
          // Ensure 'return' here
          batch,
          userContextPrompt,
          targetLanguage,
          retries - 1
        );
      }
      console.error(
        "Error analyzing batch with OpenAI:",
        axiosError.response?.data || axiosError.message
      );
      throw axiosError;
    }
  }

  async analyzeCommits(
    request: BackendAnalysisRequest
  ): Promise<BackendAnalysisResponse> {
    const { commitBundle, language } = request;
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured for analyzeCommits.");
    }
    if (!commitBundle || commitBundle.length === 0) {
      console.warn("analyzeCommits called with empty commitBundle.");
      return { analysisResults: [] };
    }

    const batches = createCommitBatchesForAnalysis(commitBundle);
    // processBatchesConcurrently is now typed to return Promise<SingleCommitAnalysis[]>
    // if 'this.analyzeSingleBatch' is the processor and it returns Promise<SingleCommitAnalysis[]>
    const allAnalysesResults: SingleCommitAnalysis[] =
      await processBatchesConcurrently(
        batches,
        this.analyzeSingleBatch.bind(this),
        undefined, // userContextPrompt - not used from BackendAnalysisRequest directly
        language
      );
    return { analysisResults: allAnalysesResults };
  }

  async generateReleaseNotes(
    request: BackendUpdateNotesRequest
  ): Promise<BackendUpdateNotesResponse> {
    const { analysisResults, language, isAuthorIncluded } = request;
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is not configured for generateReleaseNotes."
      );
    }
    if (!analysisResults || analysisResults.length === 0) {
      console.warn("generateReleaseNotes called with no analysis results.");
      return { updateNotes: "" };
    }

    const authorInstructions = isAuthorIncluded
      ? `- Please group the update notes by author name.`
      : "";
    const fullPrompt = `${BASE_UPDATE_NOTES_PROMPT}
${authorInstructions}
Output language: ${language}.
Aggregated analysis of code changes:
${JSON.stringify(analysisResults)}`;

    if (estimateTokens(fullPrompt) > MAX_INPUT_TOKENS) {
      console.warn("Update notes prompt is very large, may hit token limits.");
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fullPrompt }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      const notes = response.data.choices[0].message?.content?.trim();
      if (!notes) {
        throw new Error("OpenAI returned empty content for update notes.");
      }
      return { updateNotes: notes }; // Ensure 'return' here
    } catch (error: any) {
      const axiosError = error as AxiosError;
      console.error(
        "Error generating update notes with OpenAI:",
        axiosError.response?.data || axiosError.message
      );
      throw axiosError;
    }
  }
}

export default new OpenAIService();
