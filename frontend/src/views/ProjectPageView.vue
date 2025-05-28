<!-- frontend\src\views\ProjectPageView.vue -->
<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div class="w-full md:w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-200 p-4 md:p-6 flex-shrink-0">
      <ProjectCard :project="projectStore.activeProject" :is-loading="projectStore.isLoadingProject" />
      <div v-if="projectStore.projectError && !projectStore.isLoadingProject && !projectStore.activeProject" class="mt-2 p-2 bg-red-50 text-red-600 rounded-md text-xs">
        <p>Error loading project: {{ projectStore.projectError }}</p>
        <button @click="retryFetchProjectDetails" class="mt-1 text-xs underline">Retry</button>
      </div>
    </div>

    <div class="flex-1 p-4 md:p-6 overflow-y-auto">
      <ActionSelector v-if="projectStore.activeProject && !projectStore.isLoadingProject" @onSelectAction="handleActionSelected" class="mb-6" />
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
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useCommitStore } from '../stores/commitStore' // Import if resetting on project change
import { useAiResponseStore } from '../stores/aiResponseStore' // Import if resetting on project change
import ProjectCard from '../components/ProjectCard.vue'
import ActionSelector from '../components/ActionSelector.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const commitStore = useCommitStore() // Instantiate for potential reset
const aiResponseStore = useAiResponseStore() // Instantiate for potential reset

const projectIdentifierFromRoute = computed(() => {
  const param = route.params.projectIdentifier
  return Array.isArray(param) ? param[0] : param
})

const fetchProjectData = async () => {
  const identifier = projectIdentifierFromRoute.value
  if (identifier && authStore.isUserAuthenticated) {
    const currentP = projectStore.activeProject
    const needsFetch = !currentP || (currentP.provider === 'gitlab' && String(currentP.id) !== identifier) || (currentP.provider === 'github' && currentP.path_with_namespace !== identifier) || currentP.provider !== authStore.currentProvider // Also fetch if provider mismatch

    if (needsFetch) {
      await projectStore.fetchProjectDetails(identifier)
    }
  } else if (!identifier && !projectStore.isLoadingProject) {
    console.warn('ProjectPageView: No project identifier found in route.')
    // router.push({ name: 'ProjectsView' }); // Optional: redirect if no identifier
  }
}

const retryFetchProjectDetails = () => {
  fetchProjectData()
}

onMounted(async () => {
  console.log('onMounted', 'showing project details for project:', projectIdentifierFromRoute.value)
  console.log('Project Store:', projectStore.currentProject)
  await fetchProjectData()
  // Default to commits view if project is loaded and no child route is active
  // and if we are not already on a child route of ProjectPage
  if (projectStore.activeProject && route.name === 'ProjectPage') {
    if (projectIdentifierFromRoute.value) {
      router.replace({ name: 'ProjectCommitsView', params: { projectIdentifier: projectIdentifierFromRoute.value } })
    }
  }
})

watch(
  () => projectIdentifierFromRoute.value,
  async (newIdentifier, oldIdentifier) => {
    if (newIdentifier && newIdentifier !== oldIdentifier) {
      projectStore.resetProjectState()
      commitStore.resetCommitState() // Reset related stores when project context changes
      aiResponseStore.resetAiState()
      await fetchProjectData()
      // Default to commits view after project context changes
      if (projectStore.activeProject && projectIdentifierFromRoute.value) {
        router.replace({ name: 'ProjectCommitsView', params: { projectIdentifier: projectIdentifierFromRoute.value } })
      }
    }
  }
)

watch(
  () => authStore.isUserAuthenticated,
  async (isAuth, wasAuth) => {
    if (isAuth && projectIdentifierFromRoute.value) {
      if (!wasAuth) {
        // If user just logged in
        projectStore.resetProjectState() // Reset project state to force re-fetch with new auth context
        commitStore.resetCommitState()
        aiResponseStore.resetAiState()
      }
      await fetchProjectData()
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
    // Assuming 'ProjectFileTreeView' is correctly defined for the 'documentation-generation' case
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
