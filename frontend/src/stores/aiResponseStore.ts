import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useCommitStore } from './commitStore'
import apiClient from '@/services/apiService'
import type { SingleCommitAnalysis, BackendAnalysisRequest, BackendAnalysisResponse, BackendUpdateNotesRequest, BackendUpdateNotesResponse } from '@/types/ai.ts'
import type { BackendCommitBundleItem } from '@/types/commit.ts'

export interface AiResponseState {
  analysisResults: SingleCommitAnalysis[] | null
  generatedNotes: string | null
  isLoadingAnalysis: boolean
  isLoadingNotesGeneration: boolean
  errorAnalysis: string | null
  errorNotesGeneration: string | null
  targetLanguage: string
  isAuthorInclusionEnabled: boolean
}

export const useAiResponseStore = defineStore('aiResponse', {
  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  state: (): AiResponseState => ({
    // 👇 add `as <type>` so Pinia infers the union you want
    analysisResults: null as SingleCommitAnalysis[] | null,
    generatedNotes: null as string | null,

    isLoadingAnalysis: false,
    isLoadingNotesGeneration: false,

    errorAnalysis: null as string | null,
    errorNotesGeneration: null as string | null,

    targetLanguage: localStorage.getItem('aiTargetLanguage') || 'english',
    isAuthorInclusionEnabled: JSON.parse(localStorage.getItem('aiIsAuthorIncluded') || 'false')
  }),

  /* ------------------------------------------------------------------ */
  /* getters                                                             */
  /* ------------------------------------------------------------------ */
  getters: {
    currentAnalysisResults: (state): SingleCommitAnalysis[] | null => state.analysisResults,
    currentGeneratedNotes: (state): string | null => state.generatedNotes
  },

  /* ------------------------------------------------------------------ */
  /* actions                                                             */
  /* ------------------------------------------------------------------ */
  actions: {
    /* ---------------- user prefs ---------------- */
    setTargetLanguage(language: string): void {
      this.targetLanguage = language
      localStorage.setItem('aiTargetLanguage', language)
    },

    setIsAuthorInclusionEnabled(enabled: boolean): void {
      this.isAuthorInclusionEnabled = enabled
      localStorage.setItem('aiIsAuthorIncluded', JSON.stringify(enabled))
    },

    /* ---------------- analysis ---------------- */
    async analyzeSelectedCommits(): Promise<void> {
      const authStore = useAuthStore()
      const commitStore = useCommitStore()

      if (!authStore.isUserAuthenticated) {
        this.errorAnalysis = 'User not authenticated to perform AI analysis.'
        return
      }
      if (commitStore.selectedCommitIdsForAI.length === 0) {
        this.errorAnalysis = 'No commits selected for AI analysis.'
        return
      }

      this.isLoadingAnalysis = true
      this.errorAnalysis = null
      this.analysisResults = null

      try {
        const commitBundlesToAnalyze: BackendCommitBundleItem[] = await commitStore.prepareCommitBundlesForAI()

        if (!commitBundlesToAnalyze?.length) {
          this.errorAnalysis = 'Failed to prepare commit data for analysis.'
          return
        }

        const requestPayload: BackendAnalysisRequest = {
          commitBundle: commitBundlesToAnalyze,
          language: this.targetLanguage
        }

        const { data } = await apiClient.post<BackendAnalysisResponse>('/openai/analyze-commits', requestPayload)

        this.analysisResults = data.analysisResults
      } catch (err: any) {
        this.errorAnalysis = err.response?.data?.message || err.message || 'Failed to analyze commits.'
        this.analysisResults = null
        console.error('Error during AI commit analysis:', err)
      } finally {
        this.isLoadingAnalysis = false
      }
    },

    /* ---------------- notes generation ---------------- */
    async generateNotesFromAnalysis(): Promise<void> {
      const authStore = useAuthStore()
      if (!authStore.isUserAuthenticated) {
        this.errorNotesGeneration = 'User not authenticated to generate notes.'
        return
      }
      if (!Array.isArray(this.analysisResults) || this.analysisResults.length === 0) {
        this.errorNotesGeneration = 'No analysis results available to generate notes. Please analyze commits first.'
        return
      }

      this.isLoadingNotesGeneration = true
      this.errorNotesGeneration = null
      this.generatedNotes = null

      try {
        const requestPayload: BackendUpdateNotesRequest = {
          analysisResults: this.analysisResults,
          language: this.targetLanguage,
          isAuthorIncluded: this.isAuthorInclusionEnabled
        }

        const { data } = await apiClient.post<BackendUpdateNotesResponse>('/openai/generate-notes', requestPayload)

        this.generatedNotes = data.updateNotes
      } catch (err: any) {
        this.errorNotesGeneration = err.response?.data?.message || err.message || 'Failed to generate update notes.'
        this.generatedNotes = null
        console.error('Error during AI notes generation:', err)
      } finally {
        this.isLoadingNotesGeneration = false
      }
    },

    /* ---------------- combined flow ---------------- */
    async processCommitsAndGenerateNotes(): Promise<void> {
      this.analysisResults = null
      this.generatedNotes = null
      this.errorAnalysis = null
      this.errorNotesGeneration = null

      await this.analyzeSelectedCommits()

      const results = this.analysisResults as SingleCommitAnalysis[] | null
      if (Array.isArray(results) && results.length && !this.errorAnalysis) {
        await this.generateNotesFromAnalysis()
      }
    },

    /* ---------------- utils ---------------- */
    clearAiData(): void {
      this.analysisResults = null
      this.generatedNotes = null
      this.isLoadingAnalysis = false
      this.isLoadingNotesGeneration = false
      this.errorAnalysis = null
      this.errorNotesGeneration = null
    },

    resetAiState(): void {
      this.clearAiData()
      this.targetLanguage = 'english'
      localStorage.removeItem('aiTargetLanguage')
      this.isAuthorInclusionEnabled = false
      localStorage.removeItem('aiIsAuthorIncluded')
    }
  }
})
