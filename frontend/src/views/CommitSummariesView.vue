<template>
  <div class="bg-gray-100 min-h-screen flex">
    <div v-if="projectStore.activeProject" class="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
      <ProjectCard :project="projectStore.activeProject" :is-loading="projectStore.isLoadingProject" />
    </div>
    <div v-else class="w-1/4 bg-gray-50 border-r border-gray-200 p-4 flex items-center justify-center text-gray-500">
      <p v-if="projectStore.isLoadingProject">Loading project...</p>
      <p v-else>No project selected or details available.</p>
    </div>

    <div class="flex-1 p-8 mx-4 px-5 overflow-hidden sm:px-6 lg:px-8">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-full">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-xl font-extrabold text-gray-800 flex items-center">
            <i class="fas fa-clipboard-list mr-3 text-green-500"></i>
            AI Generated Summary
          </h1>
        </div>

        <div v-if="aiResponseStore.errorAnalysis || aiResponseStore.errorNotesGeneration" class="mb-4 text-red-500 bg-red-100 p-3 rounded-md">
          <p v-if="aiResponseStore.errorAnalysis">Error during analysis: {{ aiResponseStore.errorAnalysis }}</p>
          <p v-if="aiResponseStore.errorNotesGeneration">Error during notes generation: {{ aiResponseStore.errorNotesGeneration }}</p>
        </div>

        <div class="ai-response relative bg-gray-50 p-4 rounded-md shadow-inner min-h-[200px]">
          <div v-if="isLoadingAIResponse" class="flex items-center justify-center py-10 absolute inset-0 bg-gray-50 bg-opacity-75">
            <i class="fas fa-spinner fa-spin text-3xl text-green-500"></i>
            <p class="ml-3 text-gray-700">
              {{ aiResponseStore.isLoadingAnalysis ? 'Analyzing commits...' : aiResponseStore.isLoadingNotesGeneration ? 'Generating notes...' : 'Loading...' }}
            </p>
          </div>
          <Textarea v-else v-model="displayedText" class="font-mono text-lg leading-relaxed w-full bg-transparent border-none focus:ring-0" :style="{ minHeight: '200px' }" readonly />
        </div>

        <button v-show="displayedText && !isLoadingAIResponse" class="copy-button mt-6 px-5 py-3 bg-blue-600 text-white rounded-md flex items-center justify-center relative hover:bg-blue-700 transition duration-200" @click="copyToClipboard">
          <i class="fas fa-copy mr-3"></i>
          Copy
          <div v-if="copiedMessageVisible" class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm rounded px-3 py-1 shadow-lg opacity-0 animate-fade-in"><i class="fas fa-check mr-2"></i> Copied to Clipboard</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { useCommitStore } from '../stores/commitStore' // Import commitStore
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProjectCard from '../components/ProjectCard.vue'
import { Textarea } from '../components/ui/textarea'

const projectStore = useProjectStore()
const aiResponseStore = useAiResponseStore()
const commitStore = useCommitStore() // Instantiate commitStore
const router = useRouter()
const route = useRoute()

const copiedMessageVisible = ref(false)
const displayedText = ref('')
let typewriterInterval: number | null = null

const isLoadingAIResponse = computed(() => aiResponseStore.isLoadingAnalysis || aiResponseStore.isLoadingNotesGeneration)

const copyToClipboard = () => {
  if (!displayedText.value) return
  navigator.clipboard
    .writeText(displayedText.value)
    .then(() => {
      copiedMessageVisible.value = true
      setTimeout(() => {
        copiedMessageVisible.value = false
      }, 2000)
    })
    .catch((err) => {
      console.error('Failed to copy text: ', err)
    })
}

const typeWriterEffect = (text: string | null) => {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval)
  }
  displayedText.value = ''
  if (text === null || text === undefined) return

  let index = 0
  const typingSpeed = 15

  typewriterInterval = window.setInterval(() => {
    if (index < text.length) {
      displayedText.value += text.charAt(index)
      index++
    } else {
      if (typewriterInterval !== null) clearInterval(typewriterInterval)
      typewriterInterval = null
    }
  }, typingSpeed)
}

onMounted(async () => {
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
    await projectStore.fetchProjectDetails(projectIdentifierToLoad)
  }

  if (aiResponseStore.currentGeneratedNotes) {
    typeWriterEffect(aiResponseStore.currentGeneratedNotes)
  } else if (projectStore.activeProject && commitStore.selectedCommitIdsForAI.length > 0 && !isLoadingAIResponse.value) {
    // If project is loaded, commits are selected, and not already loading/has notes, then process
    // This makes the view proactive in fetching AI summary if context is available.
    aiResponseStore.processCommitsAndGenerateNotes()
  } else if (!isLoadingAIResponse.value) {
    // If not loading and no notes, and can't initiate AI process
    // displayedText.value = "No summary available. Please select commits and trigger analysis.";
  }
})

watch(
  () => aiResponseStore.currentGeneratedNotes,
  (newVal) => {
    typeWriterEffect(newVal)
  }
)

onUnmounted(() => {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval)
  }
  // Consider if aiResponseStore.clearAiData() should be called here
  // depending on whether user should see old results if they navigate back.
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.3s forwards;
}
.ai-response textarea {
  resize: none;
  overflow-y: auto;
}
</style>
