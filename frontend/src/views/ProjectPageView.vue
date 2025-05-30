<!-- frontend\src\views\ProjectPageView.vue -->
<template>
  <div class="min-h-screen bg-background">
    <!-- Modern backdrop with subtle pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

    <div class="relative min-h-screen flex flex-col md:flex-row">
      <!-- Left Sidebar with Project Card -->
      <div class="w-full md:w-72 lg:w-80 xl:w-96 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 md:p-6 flex-shrink-0 shadow-lg shadow-black/5 dark:shadow-black/20">
        <ProjectCard :project="project" :is-loading="status === 'loading'" />
        <div v-if="status === 'error' && !project" class="mt-4">
          <div class="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
            <div class="flex items-center space-x-2 mb-2">
              <i class="fa-solid fa-exclamation-triangle text-sm"></i>
              <span class="font-medium">Error loading project</span>
            </div>
            <p class="text-xs mb-2">{{ projectStore.projectError }}</p>
            <button @click="retryFetchProjectDetails" class="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"><i class="fa-solid fa-refresh mr-1"></i>Retry</button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 bg-background/50 backdrop-blur-sm overflow-y-auto">
        <div class="p-4 md:p-6">
          <ActionSelector v-if="project && status === 'ready'" @onSelectAction="handleActionSelected" class="mb-6" />
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
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
