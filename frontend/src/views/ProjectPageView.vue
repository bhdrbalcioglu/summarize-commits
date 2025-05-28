<!-- frontend\src\views\ProjectPageView.vue -->
<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div class="w-full md:w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-200 p-4 md:p-6 flex-shrink-0">
      <ProjectCard :project="project" :is-loading="status === 'loading'" />
      <div v-if="status === 'error' && !project" class="mt-2 p-2 bg-red-50 text-red-600 rounded-md text-xs">
        <p>Error loading project: {{ projectStore.projectError }}</p>
        <button @click="retryFetchProjectDetails" class="mt-1 text-xs underline">Retry</button>
      </div>
    </div>

    <div class="flex-1 p-4 md:p-6 overflow-y-auto">
      <ActionSelector v-if="project && status === 'ready'" @onSelectAction="handleActionSelected" class="mb-6" />
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useCommitStore } from '../stores/commitStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { useProjectContext } from '../composables/useProjectContext'
import ProjectCard from '../components/ProjectCard.vue'
import ActionSelector from '../components/ActionSelector.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const commitStore = useCommitStore()
const aiResponseStore = useAiResponseStore()

// Use the new composable
const { project, status, loadProject } = useProjectContext()

const projectIdentifierFromRoute = computed(() => {
  const param = route.params.projectIdentifier
  return Array.isArray(param) ? param[0] : param
})

const retryFetchProjectDetails = () => {
  const identifier = projectIdentifierFromRoute.value
  if (identifier) {
    loadProject(identifier)
  }
}

onMounted(async () => {
  console.log('onMounted', 'showing project details for project:', projectIdentifierFromRoute.value)
  console.log('Project Store:', projectStore.currentProject)
  
  const identifier = projectIdentifierFromRoute.value
  if (identifier && authStore.isUserAuthenticated) {
    await loadProject(identifier)
    
    // Default to commits view if project is loaded and no child route is active
    if (project.value && route.name === 'ProjectPage') {
      router.replace({ name: 'ProjectCommitsView', params: { projectIdentifier: identifier } })
    }
  } else if (!identifier) {
    console.warn('ProjectPageView: No project identifier found in route.')
  }
})

watch(
  () => projectIdentifierFromRoute.value,
  async (newIdentifier, oldIdentifier) => {
    if (newIdentifier && newIdentifier !== oldIdentifier) {
      projectStore.resetProjectState()
      commitStore.resetCommitState()
      aiResponseStore.resetAiState()
      
      if (authStore.isUserAuthenticated) {
        await loadProject(newIdentifier)
        
        // Default to commits view after project context changes
        if (project.value) {
          router.replace({ name: 'ProjectCommitsView', params: { projectIdentifier: newIdentifier } })
        }
      }
    }
  }
)

watch(
  () => authStore.isUserAuthenticated,
  async (isAuth, wasAuth) => {
    const identifier = projectIdentifierFromRoute.value
    if (isAuth && identifier) {
      if (!wasAuth) {
        // If user just logged in
        projectStore.resetProjectState()
        commitStore.resetCommitState()
        aiResponseStore.resetAiState()
      }
      await loadProject(identifier)
    } else if (!isAuth) {
      projectStore.resetProjectState()
      commitStore.resetCommitState()
      aiResponseStore.resetAiState()
    }
  }
)

const handleActionSelected = (action: 'commit-summary' | 'documentation-generation') => {
  const currentProjectIdentifier = projectIdentifierFromRoute.value
  if (!currentProjectIdentifier) return

  if (action === 'commit-summary') {
    router.push({ name: 'ProjectCommitsView', params: { projectIdentifier: currentProjectIdentifier } })
  } else if (action === 'documentation-generation') {
    router.push({ name: 'ProjectFileTreeView', params: { projectIdentifier: currentProjectIdentifier } })
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
