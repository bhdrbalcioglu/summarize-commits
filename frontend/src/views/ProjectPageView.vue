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
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useProjectContext } from '../composables/useProjectContext'
import ProjectCard from '../components/ProjectCard.vue'
import ActionSelector from '../components/ActionSelector.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

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

onMounted(() => {
  // Router guard ensures project is loaded, so just redirect to commits view if needed
  if (project.value && route.name === 'ProjectPage') {
    const identifier = projectIdentifierFromRoute.value
    if (identifier) {
      router.replace({ name: 'ProjectCommitsView', params: { projectIdentifier: identifier } })
    }
  }
})

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
