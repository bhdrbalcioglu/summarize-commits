// backend/src/types/ai.types.ts
import { BackendCommitBundleItem } from "./git.types.js"; // From your git.types.ts

// --- Request to your backend's analysis endpoint ---
export interface BackendAnalysisRequest {
  commitBundle: BackendCommitBundleItem[]; // The commit data to analyze
  language: string; // Target language for the output from AI
  // userContextPrompt?: string;          // Removed based on your decision (prompts are static in backend)
}

// --- Structure of a single analyzed commit (what OpenAI is expected to return PER commit) ---
export interface SingleCommitAnalysis {
  commitMessage: string;
  commitID: string;
  authorName: string;
  description: string;
  category:
    | "Bug Fix"
    | "Improvement"
    | "New Feature"
    | "Refactoring"
    | "Documentation Update"
    | "Other (Specify)"
    | string; // Allow string for "Other"
  affectedAreas: string[];
  languageOrFramework: string;
}

// --- Response from your backend's analysis endpoint ---
export interface BackendAnalysisResponse {
  analysisResults: SingleCommitAnalysis[];
}

// --- Request to your backend's notes generation endpoint ---
export interface BackendUpdateNotesRequest {
  analysisResults: SingleCommitAnalysis[]; // The results from the analysis step
  language: string;
  isAuthorIncluded?: boolean;
  // userContextPrompt?: string;          // Removed based on your decision
}

// --- Response from your backend's notes generation endpoint ---
export interface BackendUpdateNotesResponse {
  updateNotes: string; // The final generated text for release notes/summary
}

// --- Interface for a modular AI Summarization Service (for future flexibility) ---
export interface AISummarizationService {
  analyzeCommits(
    request: BackendAnalysisRequest
  ): Promise<BackendAnalysisResponse>;
  generateReleaseNotes(
    request: BackendUpdateNotesRequest
  ): Promise<BackendUpdateNotesResponse>;
}
