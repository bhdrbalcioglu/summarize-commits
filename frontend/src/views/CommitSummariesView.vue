<template>
  <div class="min-h-screen bg-background">
    <div class="flex h-screen">
      <!-- Project Sidebar -->
      <div v-if="projectStore.activeProject" class="w-80 bg-card/50 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
        <ProjectCard :project="projectStore.activeProject" :is-loading="projectStore.isLoadingProject" />
      </div>
      <div v-else class="w-80 bg-card/50 backdrop-blur-xl border-r border-border/50 p-6 flex items-center justify-center">
        <div class="text-center space-y-3">
          <div v-if="projectStore.isLoadingProject" class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p class="text-muted-foreground">Loading project...</p>
          </div>
          <div v-else class="flex flex-col items-center gap-3">
            <i class="fas fa-folder-open text-4xl text-muted-foreground/50"></i>
            <p class="text-muted-foreground">No project selected or details available.</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 p-6 overflow-hidden flex flex-col">
        <div class="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 p-8 flex-1 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30">
          <!-- Header -->
          <div class="flex justify-between items-center mb-8">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <i class="fas fa-robot text-2xl text-primary"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-foreground">AI Generated Summary</h1>
                <p class="text-muted-foreground">Your commits transformed into professional release notes</p>
              </div>
            </div>
          </div>

          <!-- Error States -->
          <div v-if="aiResponseStore.errorAnalysis || aiResponseStore.errorNotesGeneration" class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div class="flex items-start gap-3">
              <i class="fas fa-exclamation-triangle text-destructive text-lg mt-0.5"></i>
              <div class="flex-1">
                <h3 class="font-semibold text-destructive mb-2">Processing Error</h3>
                <div class="space-y-1 text-sm text-destructive/80">
                  <p v-if="aiResponseStore.errorAnalysis">Analysis Error: {{ aiResponseStore.errorAnalysis }}</p>
                  <p v-if="aiResponseStore.errorNotesGeneration">Generation Error: {{ aiResponseStore.errorNotesGeneration }}</p>
                </div>
                <button @click="retryAIProcessing" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md" :disabled="isLoadingAIResponse">
                  <i class="fas fa-redo text-sm"></i>
                  <span>{{ isLoadingAIResponse ? 'Retrying...' : 'Retry' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- No Commits Warning -->
          <div v-else-if="!isLoadingAIResponse && !aiResponseStore.currentGeneratedNotes && commitStore.selectedCommitIdsForAI.length === 0" class="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
            <div class="flex items-start gap-3">
              <i class="fas fa-info-circle text-amber-600 dark:text-amber-400 text-lg mt-0.5"></i>
              <div class="flex-1">
                <h3 class="font-semibold text-amber-800 dark:text-amber-200 mb-2">No Commits Selected</h3>
                <p class="text-amber-700 dark:text-amber-300 text-sm mb-3">Please select commits from your repository to generate AI-powered release notes.</p>
                <button @click="navigateToCommits" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md">
                  <i class="fas fa-arrow-left text-sm"></i>
                  <span>Select Commits</span>
                </button>
              </div>
            </div>
          </div>

          <!-- AI Text Display -->
          <div class="flex-1 min-h-0">
            <EnhancedTextDisplay :text="aiResponseStore.currentGeneratedNotes" :is-loading="isLoadingAIResponse" :loading-message="loadingMessage" @text-updated="handleTextUpdate" />
          </div>
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
/* Additional styles for enhanced visual appeal */
.min-h-screen {
  min-height: 100vh;
}

/* Smooth transitions for all interactive elements */
button {
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
