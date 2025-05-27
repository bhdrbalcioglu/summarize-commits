// frontend/src/types/ai.ts

import type { BackendCommitBundleItem } from './commit' // Or './git' if you create a combined git types


export interface BackendAnalysisRequest {
  commitBundle: BackendCommitBundleItem[]
  language: string

}

// --- Structure of a single analyzed commit (received from backend) ---
export interface SingleCommitAnalysis {
  commitMessage: string
  commitID: string
  authorName: string
  description: string
  category: 'Bug Fix' | 'Improvement' | 'New Feature' | 'Refactoring' | 'Documentation Update' | 'Other (Specify)' | string // Allow string for "Other"
  affectedAreas: string[]
  languageOrFramework: string
}

// --- Response from your backend's analysis endpoint (received by frontend) ---
export interface BackendAnalysisResponse {
  analysisResults: SingleCommitAnalysis[]
}

// --- Request to your backend's notes generation endpoint (sent by frontend) ---
export interface BackendUpdateNotesRequest {
  analysisResults: SingleCommitAnalysis[]
  language: string
  isAuthorIncluded?: boolean
  // userContextPrompt was removed from backend type
}

// --- Response from your backend's notes generation endpoint (received by frontend) ---
export interface BackendUpdateNotesResponse {
  updateNotes: string
}

