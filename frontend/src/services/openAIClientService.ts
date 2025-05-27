// frontend/src/services/openAIClientService.ts
import apiClient from './apiService'
// Import aligned types from your frontend's central type definitions
import type {
  BackendCommitBundleItem // From '@/types/commit' or '@/types/git'
} from '@/types/commit' // Adjust path as needed
import type {
  BackendAnalysisRequest,
  BackendAnalysisResponse,
  BackendUpdateNotesRequest,
  BackendUpdateNotesResponse,
  SingleCommitAnalysis // This is the item type for analysisResults
} from '@/types/ai' // Assuming you created this file


export const generateOverallSummaryFromCommitBundles = async (
  commitBundles: BackendCommitBundleItem[], // Changed from Commit[] to BackendCommitBundleItem[]
  language: string,
  isAuthorIncluded: boolean
): Promise<string> => {
  if (!commitBundles || commitBundles.length === 0) {
    throw new Error('No commit bundles provided for AI processing.')
  }


  const analysisRequestData: BackendAnalysisRequest = {
    commitBundle: commitBundles,
    language: language
  }
  const analysisResponse = await apiClient.post<BackendAnalysisResponse>(
    '/openai/analyze-commits',
    analysisRequestData
  )
  const analysisResults = analysisResponse.data.analysisResults

  if (!analysisResults || analysisResults.length === 0) {
    throw new Error('Backend did not return analysis results.')
  }


  const notesRequestData: BackendUpdateNotesRequest = {
    analysisResults: analysisResults,
    language: language,
    isAuthorIncluded: isAuthorIncluded
  }
  const notesResponse = await apiClient.post<BackendUpdateNotesResponse>(
    '/openai/generate-notes', 
    notesRequestData
  )

  return notesResponse.data.updateNotes
}


export const analyzeCommitBundlesWithBackend = async (requestData: BackendAnalysisRequest): Promise<BackendAnalysisResponse> => {
 
  const response = await apiClient.post<BackendAnalysisResponse>('/openai/analyze-commits', requestData)
  return response.data
}


export const generateUpdateNotesWithBackend = async (requestData: BackendUpdateNotesRequest): Promise<BackendUpdateNotesResponse> => {
  const response = await apiClient.post<BackendUpdateNotesResponse>('/openai/generate-notes', requestData)
  return response.data
}
