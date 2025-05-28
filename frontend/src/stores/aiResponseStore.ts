import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useCommitStore } from './commitStore'
import apiClient from '@/services/apiService'
import type { SingleCommitAnalysis, BackendAnalysisRequest, BackendAnalysisResponse, BackendUpdateNotesRequest, BackendUpdateNotesResponse } from '@/types/ai.ts'
import type { BackendCommitBundleItem } from '@/types/commit.ts'
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage'

export interface AiResponseState {
  analysisResult: any | null
  notesResult: any | null
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
    analysisResult: null,
    notesResult: null,
    isLoadingAnalysis: false,
    isLoadingNotesGeneration: false,
    errorAnalysis: null,
    errorNotesGeneration: null,
    targetLanguage: getStorageValue(GLOBAL_KEYS.AI_TARGET_LANGUAGE, 'english'),
    isAuthorInclusionEnabled: getStorageValue(GLOBAL_KEYS.AI_AUTHOR_INCLUSION, false)
  }),

  /* ------------------------------------------------------------------ */
  /* getters                                                             */
  /* ------------------------------------------------------------------ */
  getters: {
    currentAnalysisResults: (state): SingleCommitAnalysis[] | null => state.analysisResult,
    currentGeneratedNotes: (state): string | null => state.notesResult
  },

  /* ------------------------------------------------------------------ */
  /* actions                                                             */
  /* ------------------------------------------------------------------ */
  actions: {
    /* ---------------- user prefs ---------------- */
    setTargetLanguage(language: string): void {
      this.targetLanguage = language
      setStorageValue(GLOBAL_KEYS.AI_TARGET_LANGUAGE, language)
    },

    setIsAuthorInclusionEnabled(enabled: boolean): void {
      this.isAuthorInclusionEnabled = enabled
      setStorageValue(GLOBAL_KEYS.AI_AUTHOR_INCLUSION, enabled)
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
      this.analysisResult = null

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

        this.analysisResult = data.analysisResults
      } catch (err: any) {
        this.errorAnalysis = err.response?.data?.message || err.message || 'Failed to analyze commits.'
        this.analysisResult = null
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
      if (!Array.isArray(this.analysisResult) || this.analysisResult.length === 0) {
        this.errorNotesGeneration = 'No analysis results available to generate notes. Please analyze commits first.'
        return
      }

      this.isLoadingNotesGeneration = true
      this.errorNotesGeneration = null
      this.notesResult = null

      try {
        const requestPayload: BackendUpdateNotesRequest = {
          analysisResults: this.analysisResult,
          language: this.targetLanguage,
          isAuthorIncluded: this.isAuthorInclusionEnabled
        }

        const { data } = await apiClient.post<BackendUpdateNotesResponse>('/openai/generate-notes', requestPayload)

        this.notesResult = data.updateNotes
      } catch (err: any) {
        this.errorNotesGeneration = err.response?.data?.message || err.message || 'Failed to generate update notes.'
        this.notesResult = null
        console.error('Error during AI notes generation:', err)
      } finally {
        this.isLoadingNotesGeneration = false
      }
    },

    /* ---------------- combined flow ---------------- */
    async processCommitsAndGenerateNotes(): Promise<void> {
      this.analysisResult = null
      this.notesResult = null
      this.errorAnalysis = null
      this.errorNotesGeneration = null

      await this.analyzeSelectedCommits()

      const results = this.analysisResult as SingleCommitAnalysis[] | null
      if (Array.isArray(results) && results.length && !this.errorAnalysis) {
        await this.generateNotesFromAnalysis()
      }
    },

    /* ---------------- utils ---------------- */
    clearAiData(): void {
      this.analysisResult = null
      this.notesResult = null
      this.isLoadingAnalysis = false
      this.isLoadingNotesGeneration = false
      this.errorAnalysis = null
      this.errorNotesGeneration = null
    },

    resetAiState(): void {
      this.clearAiData()
      this.targetLanguage = 'english'
      removeStorageValue(GLOBAL_KEYS.AI_TARGET_LANGUAGE)
      this.isAuthorInclusionEnabled = false
      removeStorageValue(GLOBAL_KEYS.AI_AUTHOR_INCLUSION)
    }
  }
})
