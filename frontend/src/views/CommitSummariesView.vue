<template>
  <div class="bg-gray-100 min-h-screen flex">
    <div v-if="projectStore.activeProject" class="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
      <ProjectCard :project="projectStore.activeProject" :is-loading="projectStore.isLoadingProject" />
    </div>
    <div v-else class="w-1/4 bg-gray-50 border-r border-gray-200 p-4 flex items-center justify-center text-gray-500">
      <p v-if="projectStore.isLoadingProject">Loading project...</p>
      <p v-else>No project selected or details available.</p>
    </div>

    <div class="flex-1 p-8 mx-4 px-5 overflow-hidden sm:px-6 lg:px-8 flex flex-col">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-full flex-1 flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-xl font-extrabold text-gray-800 flex items-center">
            <i class="fas fa-clipboard-list mr-3 text-green-500"></i>
            AI Generated Summary
          </h1>
        </div>

        <div v-if="aiResponseStore.errorAnalysis || aiResponseStore.errorNotesGeneration" class="mb-4 text-red-500 bg-red-100 p-3 rounded-md">
          <p v-if="aiResponseStore.errorAnalysis">Error during analysis: {{ aiResponseStore.errorAnalysis }}</p>
          <p v-if="aiResponseStore.errorNotesGeneration">Error during notes generation: {{ aiResponseStore.errorNotesGeneration }}</p>
          <div class="mt-3">
            <button 
              @click="retryAIProcessing" 
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              :disabled="isLoadingAIResponse"
            >
              <i class="fas fa-redo mr-2"></i>
              Retry
            </button>
          </div>
        </div>

        <!-- No commits selected warning -->
        <div v-else-if="!isLoadingAIResponse && !aiResponseStore.currentGeneratedNotes && commitStore.selectedCommitIdsForAI.length === 0" class="mb-4 text-yellow-600 bg-yellow-100 p-3 rounded-md">
          <p>No commits are selected for AI processing.</p>
          <div class="mt-3">
            <button 
              @click="navigateToCommits" 
              class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
            >
              <i class="fas fa-arrow-left mr-2"></i>
              Go Back to Select Commits
            </button>
          </div>
        </div>

        <div class="flex-1">
          <EnhancedTextDisplay
            :text="aiResponseStore.currentGeneratedNotes"
            :is-loading="isLoadingAIResponse"
            :loading-message="loadingMessage"
            @text-updated="handleTextUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { useCommitStore } from '../stores/commitStore'
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProjectCard from '../components/ProjectCard.vue'
import EnhancedTextDisplay from '../components/EnhancedTextDisplay.vue'

const projectStore = useProjectStore()
const aiResponseStore = useAiResponseStore()
const commitStore = useCommitStore()
const router = useRouter()
const route = useRoute()

const isLoadingAIResponse = computed(() => aiResponseStore.isLoadingAnalysis || aiResponseStore.isLoadingNotesGeneration)

const loadingMessage = computed(() => {
  if (aiResponseStore.isLoadingAnalysis) return 'Analyzing commits...'
  if (aiResponseStore.isLoadingNotesGeneration) return 'Generating notes...'
  return 'Loading...'
})

const handleTextUpdate = (newText: string) => {
  aiResponseStore.updateNotesResult(newText)
}

const retryAIProcessing = () => {
  console.log('🔄 [CommitSummariesView] Retrying AI processing...')
  aiResponseStore.processCommitsAndGenerateNotes()
}

const navigateToCommits = () => {
  console.log('🔙 [CommitSummariesView] Navigating back to commits...')
  router.push({ name: 'Commits' })
}

onMounted(async () => {
  console.log('🎯 [CommitSummariesView] Component mounted')
  console.log('📊 [CommitSummariesView] Selected commits:', commitStore.selectedCommitIdsForAI.length)
  console.log('🤖 [CommitSummariesView] Current notes:', !!aiResponseStore.currentGeneratedNotes)
  console.log('⏳ [CommitSummariesView] Is loading:', isLoadingAIResponse.value)

  let projectIdentifierToLoad: string | number | undefined = undefined

  if (!projectStore.activeProject) {
    const routeParamIdentifier = route.params.projectIdentifier
    if (routeParamIdentifier) {
      projectIdentifierToLoad = Array.isArray(routeParamIdentifier) ? routeParamIdentifier[0] : routeParamIdentifier
    }
  } else {
    // Project is already in store, use its identifier if needed (e.g. path_with_namespace for GitHub)
    projectIdentifierToLoad = projectStore.activeProject.provider === 'github' ? projectStore.activeProject.path_with_namespace : projectStore.activeProject.id
  }

  if (projectIdentifierToLoad && (!projectStore.activeProject || (String(projectStore.activeProject.id) !== String(projectIdentifierToLoad).split('/')[0] && projectStore.activeProject.path_with_namespace !== projectIdentifierToLoad))) {
    // Fetch if project in store is different or not loaded
    console.log('🔄 [CommitSummariesView] Loading project details...')
    await projectStore.fetchProjectDetails(projectIdentifierToLoad)
  }

  // Enhanced logic for handling immediate navigation from CommitsView
  if (projectStore.activeProject && commitStore.selectedCommitIdsForAI.length > 0) {
    if (!isLoadingAIResponse.value && !aiResponseStore.currentGeneratedNotes) {
      // Start AI processing if we have commits selected but no processing has started
      console.log('🚀 [CommitSummariesView] Starting AI processing automatically...')
      aiResponseStore.processCommitsAndGenerateNotes()
    } else if (isLoadingAIResponse.value) {
      // AI processing is already in progress (likely from immediate navigation)
      console.log('⏳ [CommitSummariesView] AI processing already in progress...')
    } else if (aiResponseStore.currentGeneratedNotes) {
      // Notes are already available
      console.log('✅ [CommitSummariesView] Notes already available')
    }
  } else if (commitStore.selectedCommitIdsForAI.length === 0) {
    console.log('⚠️ [CommitSummariesView] No commits selected for AI processing')
  }
})
</script>

<style scoped>
/* Styles are now handled by the EnhancedTextDisplay component */
</style>
