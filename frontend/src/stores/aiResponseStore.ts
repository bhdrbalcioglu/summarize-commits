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
      console.log('🔬 [aiResponseStore] Starting analyzeSelectedCommits')
      
      const authStore = useAuthStore()
      const commitStore = useCommitStore()

      if (!authStore.isUserAuthenticated) {
        console.log('❌ [aiResponseStore] User not authenticated')
        this.errorAnalysis = 'User not authenticated to perform AI analysis.'
        return
      }
      if (commitStore.selectedCommitIdsForAI.length === 0) {
        console.log('❌ [aiResponseStore] No commits selected')
        this.errorAnalysis = 'No commits selected for AI analysis.'
        return
      }

      console.log('📦 [aiResponseStore] Preparing commit bundles...')
      this.isLoadingAnalysis = true
      this.errorAnalysis = null
      this.analysisResult = null

      try {
        const commitBundlesToAnalyze: BackendCommitBundleItem[] = await commitStore.prepareCommitBundlesForAI()
        console.log('✅ [aiResponseStore] Commit bundles prepared:', commitBundlesToAnalyze.length, 'bundles')
        console.log('📋 [aiResponseStore] First bundle sample:', commitBundlesToAnalyze[0])

        if (!commitBundlesToAnalyze?.length) {
          console.log('❌ [aiResponseStore] No commit bundles prepared')
          this.errorAnalysis = 'Failed to prepare commit data for analysis.'
          return
        }

        const requestPayload: BackendAnalysisRequest = {
          commitBundle: commitBundlesToAnalyze,
          language: this.targetLanguage
        }
        console.log('🌐 [aiResponseStore] Sending analysis request to backend:', requestPayload)

        const { data } = await apiClient.post<any>('/openai/analyze-commits', requestPayload)
        console.log('✅ [aiResponseStore] Analysis response received:', data)

        // Handle potential response wrapping from backend
        let analysisData = data
        if (analysisData && typeof analysisData === 'object' && 'status' in analysisData && 'data' in analysisData) {
          console.log(`[aiResponseStore] Backend response is wrapped, extracting data from status: ${analysisData.status}`)
          analysisData = analysisData.data
        }

        this.analysisResult = analysisData.analysisResults
        console.log('💾 [aiResponseStore] Analysis results stored:', this.analysisResult?.length, 'results')
      } catch (err: any) {
        console.error('💥 [aiResponseStore] Error during analysis:', err)
        console.error('📄 [aiResponseStore] Error response:', err.response?.data)
        this.errorAnalysis = err.response?.data?.message || err.message || 'Failed to analyze commits.'
        this.analysisResult = null
        console.error('Error during AI commit analysis:', err)
      } finally {
        this.isLoadingAnalysis = false
        console.log('🏁 [aiResponseStore] Analysis phase completed')
      }
    },

    /* ---------------- notes generation ---------------- */
    async generateNotesFromAnalysis(): Promise<void> {
      console.log('📝 [aiResponseStore] Starting generateNotesFromAnalysis')
      
      const authStore = useAuthStore()
      if (!authStore.isUserAuthenticated) {
        console.log('❌ [aiResponseStore] User not authenticated for notes generation')
        this.errorNotesGeneration = 'User not authenticated to generate notes.'
        return
      }
      if (!Array.isArray(this.analysisResult) || this.analysisResult.length === 0) {
        console.log('❌ [aiResponseStore] No analysis results available')
        this.errorNotesGeneration = 'No analysis results available to generate notes. Please analyze commits first.'
        return
      }

      console.log('📊 [aiResponseStore] Analysis results available:', this.analysisResult.length, 'results')
      this.isLoadingNotesGeneration = true
      this.errorNotesGeneration = null
      this.notesResult = null

      try {
        const requestPayload: BackendUpdateNotesRequest = {
          analysisResults: this.analysisResult,
          language: this.targetLanguage,
          isAuthorIncluded: this.isAuthorInclusionEnabled
        }
        console.log('🌐 [aiResponseStore] Sending notes generation request:', requestPayload)

        const { data } = await apiClient.post<any>('/openai/generate-notes', requestPayload)
        console.log('✅ [aiResponseStore] Notes generation response received:', data)

        // Handle potential response wrapping from backend
        let notesData = data
        if (notesData && typeof notesData === 'object' && 'status' in notesData && 'data' in notesData) {
          console.log(`[aiResponseStore] Backend response is wrapped, extracting data from status: ${notesData.status}`)
          notesData = notesData.data
        }

        this.notesResult = notesData.updateNotes
        console.log('💾 [aiResponseStore] Notes result stored, length:', this.notesResult?.length, 'characters')
      } catch (err: any) {
        console.error('💥 [aiResponseStore] Error during notes generation:', err)
        console.error('📄 [aiResponseStore] Error response:', err.response?.data)
        this.errorNotesGeneration = err.response?.data?.message || err.message || 'Failed to generate update notes.'
        this.notesResult = null
      } finally {
        this.isLoadingNotesGeneration = false
        console.log('🏁 [aiResponseStore] Notes generation phase completed')
      }
    },

    /* ---------------- combined flow ---------------- */
    async processCommitsAndGenerateNotes(): Promise<void> {
      console.log('🔄 [aiResponseStore] Starting combined AI processing flow')
      
      this.analysisResult = null
      this.notesResult = null
      this.errorAnalysis = null
      this.errorNotesGeneration = null

      console.log('1️⃣ [aiResponseStore] Phase 1: Analyzing commits...')
      await this.analyzeSelectedCommits()

      const results = this.analysisResult as SingleCommitAnalysis[] | null
      if (Array.isArray(results) && results.length && !this.errorAnalysis) {
        console.log('2️⃣ [aiResponseStore] Phase 2: Generating notes from analysis...')
        await this.generateNotesFromAnalysis()
      } else {
        console.log('❌ [aiResponseStore] Skipping notes generation due to analysis failure')
      }
      
      console.log('🏁 [aiResponseStore] Combined AI processing flow completed')
    },

    /* ---------------- utils ---------------- */
    updateNotesResult(newText: string): void {
      this.notesResult = newText
    },

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
