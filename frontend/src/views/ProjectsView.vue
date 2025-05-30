<!-- frontend\src\views\ProjectsView.vue -->
<template>
  <div class="min-h-screen bg-background">
    <!-- Modern backdrop with subtle pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
    
    <div class="relative p-4 sm:p-6 lg:p-8">
      <!-- Main content card container with glassmorphism -->
      <div class="max-w-7xl mx-auto">
        <div class="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 p-6 lg:p-8">
          <!-- Header section -->
          <div class="mb-8">
            <h5 class="text-3xl font-bold text-foreground mb-2">
              {{ pageTitle }}
            </h5>
            <p class="text-muted-foreground">Manage and explore your repositories</p>
          </div>

          <!-- Search and controls section -->
          <div class="bg-muted/30 rounded-lg p-4 mb-6 border border-border/30">
            <div class="flex flex-col md:flex-row md:justify-between items-center space-y-4 md:space-y-0">
              <div class="w-full md:w-1/3">
                <div class="relative">
                  <input 
                    type="text" 
                    :value="projectListStore.searchTerm" 
                    @input="handleSearchInput" 
                    placeholder="Search projects..." 
                    class="w-full pl-10 pr-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 hover:shadow-md"
                  />
                  <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
              </div>
              <!-- Future: Add sorting/filtering controls here -->
            </div>
          </div>

          <!-- Content section -->
          <div class="bg-background/50 rounded-lg border border-border/30 overflow-hidden">
            <div v-if="projectListStore.isLoadingProjects" class="p-6">
              <SkeletonTable :rows="10" :cols="5" />
            </div>
            
            <div v-else-if="projectListStore.projectListError" class="p-6">
              <div class="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <i class="fa-solid fa-exclamation-triangle text-lg"></i>
                  <span class="font-medium">Error: {{ projectListStore.projectListError }}</span>
                </div>
                <button 
                  @click="fetchData" 
                  class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <i class="fa-solid fa-refresh mr-2"></i>Retry
                </button>
              </div>
            </div>
            
            <div v-else-if="!projectListStore.hasProjects && !projectListStore.isLoadingProjects" class="p-12 text-center">
              <div class="flex flex-col items-center space-y-4">
                <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <i class="fa-solid fa-folder-open text-2xl text-muted-foreground"></i>
                </div>
                <h3 class="text-lg font-semibold text-foreground">No projects found</h3>
                <p class="text-muted-foreground max-w-md">Try adjusting your search criteria or check your repository access.</p>
              </div>
            </div>
            
            <div v-else>
              <DataTable :projects="projectListStore.projects" @rowClick="navigateToProjectPage" />
            </div>
          </div>

          <!-- Enhanced pagination section -->
          <div v-if="projectListStore.totalPages > 1 && !projectListStore.isLoadingProjects" class="mt-8">
            <div class="bg-muted/30 rounded-lg p-4 border border-border/30">
              <div class="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                <!-- Items per page selector -->
                <div class="flex items-center space-x-3">
                  <span class="text-sm font-medium text-foreground">Items per page:</span>
                  <div class="relative">
                    <select 
                      :value="projectListStore.itemsPerPage" 
                      @change="handleItemsPerPageChange" 
                      class="appearance-none px-4 py-2 pr-8 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 hover:shadow-sm cursor-pointer"
                    >
                      <option :value="10">10</option>
                      <option :value="20">20</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                    <i class="fa-solid fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"></i>
                  </div>
                </div>

                <!-- Pagination controls -->
                <div class="flex items-center space-x-2">
                  <!-- Previous button -->
                  <button 
                    class="group px-3 py-2 border border-border rounded-lg bg-card hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm disabled:hover:shadow-none" 
                    @click="goToPage(projectListStore.currentPage - 1)" 
                    :disabled="projectListStore.currentPage === 1"
                  >
                    <i class="fa-solid fa-chevron-left transition-transform group-hover:-translate-x-0.5"></i>
                  </button>

                  <!-- Page info -->
                  <div class="px-4 py-2 bg-background border border-border rounded-lg">
                    <span class="text-sm text-foreground font-medium">
                      Page <span class="font-bold text-primary">{{ projectListStore.currentPage }}</span> of <span class="font-bold">{{ projectListStore.totalPages }}</span>
                    </span>
                  </div>

                  <!-- Next button -->
                  <button 
                    class="group px-3 py-2 border border-border rounded-lg bg-card hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm disabled:hover:shadow-none" 
                    @click="goToPage(projectListStore.currentPage + 1)" 
                    :disabled="projectListStore.currentPage >= projectListStore.totalPages"
                  >
                    <i class="fa-solid fa-chevron-right transition-transform group-hover:translate-x-0.5"></i>
                  </button>
                </div>

                <!-- Page count info -->
                <div class="text-sm text-muted-foreground">
                  Showing {{ (projectListStore.currentPage - 1) * projectListStore.itemsPerPage + 1 }} to 
                  {{ Math.min(projectListStore.currentPage * projectListStore.itemsPerPage, projectListStore.totalProjects || 0) }} 
                  of {{ projectListStore.totalProjects || 0 }} results
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { debounce } from 'lodash-es'
import { useAuthStore } from '../stores/authStore'
import { useProjectListStore } from '../stores/projectListStore'
import { useGroupStore } from '../stores/groupStore' // To get selected group name
import SkeletonTable from '../components/SkeletonTable.vue'
import DataTable from '../components/projects/DataTable.vue' // Ensure this DataTable expects 'projects' prop
import type { Project } from '../types/project'

const props = defineProps({
  // groupId and groupName from route query are primarily for direct linking/bookmarking.
  // The store should derive the actual groupId to filter by from groupStore.selectedGroupId.
  groupNameFromRoute: {
    // Renamed to avoid conflict with computed groupName
    type: String,
    required: false
  }
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectListStore = useProjectListStore()
const groupStore = useGroupStore()

const pageTitle = computed(() => {
  const selectedGroupName = groupStore.selectedGroup?.name
  if (selectedGroupName) {
    return `${selectedGroupName} / Projects`
  }
  return authStore.currentProvider ? `${authStore.currentProvider.charAt(0).toUpperCase() + authStore.currentProvider.slice(1)} Projects` : 'Projects'
})

const fetchData = () => {
  // Ensure group criteria is set before fetching
  const groupIdFromRoute = route.query.groupId as string | undefined
  const targetGroupId = groupIdFromRoute || groupStore.selectedGroupId

  if (projectListStore.currentGroupId !== (targetGroupId || null)) {
    projectListStore.setGroupIdCriteria(targetGroupId || null) // This will trigger fetch via its own logic if group changes
  } else {
    projectListStore.fetchProjects() // Fetch if group is already set correctly or no group filter
  }
}

const debouncedSearch = debounce((searchTerm: string) => {
  projectListStore.setSortAndFilterCriteria({ searchTerm })
}, 500)

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  debouncedSearch(target.value)
}

const handleItemsPerPageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  projectListStore.setPagination({ itemsPerPage: parseInt(target.value, 10) })
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= projectListStore.totalPages) {
    projectListStore.setPagination({ page })
  }
}

const navigateToProjectPage = (project: Project) => {
  // For GitHub, projectIdentifier should be 'owner/repoName'
  // For GitLab, projectIdentifier can be the numeric/string ID
  const projectIdentifier = project.provider === 'github' ? project.path_with_namespace : project.id
  router.push({
    name: 'ProjectPage',
    params: { projectIdentifier: String(projectIdentifier) }
  })
}

onMounted(() => {
  // Initialize criteria from route query or groupStore on first load
  const groupIdFromRoute = route.query.groupId as string | undefined
  const initialGroupId = groupIdFromRoute || groupStore.selectedGroupId
  if (initialGroupId !== projectListStore.currentGroupId) {
    projectListStore.setGroupIdCriteria(initialGroupId) // This might trigger a fetch
  }
  // Always fetch if no projects or if group criteria just set and didn't auto-fetch
  if (projectListStore.projects.length === 0 || initialGroupId !== projectListStore.currentGroupId) {
    fetchData()
  }
})

watch(
  () => [props.groupNameFromRoute, route.query.groupId, authStore.currentProvider, groupStore.selectedGroupId],
  () => {
    // Re-evaluate group context and fetch projects if necessary
    // The projectListStore's setGroupIdCriteria and fetchProjects actions now handle the core logic.
    // This watcher ensures that if route params change (e.g., direct navigation), we update.
    const groupIdFromRoute = route.query.groupId as string | undefined
    const targetGroupId = groupIdFromRoute || groupStore.selectedGroupId

    if (projectListStore.currentGroupId !== (targetGroupId || null) || projectListStore.projects.length === 0) {
      projectListStore.setGroupIdCriteria(targetGroupId || null)
      // fetchProjects will be called by setGroupIdCriteria if group changes,
      // or if it doesn't, we might need to call it if projects are empty
      if (projectListStore.currentGroupId === (targetGroupId || null) && projectListStore.projects.length === 0 && !projectListStore.isLoadingProjects) {
        projectListStore.fetchProjects()
      }
    }
  },
  { deep: true }
)
</script>
