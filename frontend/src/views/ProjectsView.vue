<!-- frontend\src\views\ProjectsView.vue -->
<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">
      {{ pageTitle }}
    </h5>

    <div class="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-4 md:space-y-0">
      <div class="w-full md:w-1/3">
        <input type="text" :value="projectListStore.searchTerm" @input="handleSearchInput" placeholder="Search projects..." class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
      </div>
      <!-- Add sorting/filtering controls here if needed, e.g., for orderBy, sortOrder -->
    </div>

    <div v-if="projectListStore.isLoadingProjects">
      <SkeletonTable :rows="10" :cols="5" />
    </div>
    <div v-else-if="projectListStore.projectListError" class="p-4 bg-red-100 text-red-700 rounded-md">
      Error: {{ projectListStore.projectListError }}
      <button @click="fetchData" class="ml-4 px-3 py-1 bg-blue-500 text-white rounded">Retry</button>
    </div>
    <div v-else-if="!projectListStore.hasProjects && !projectListStore.isLoadingProjects" class="text-center text-gray-500 py-8">No projects found.</div>
    <div v-else>
      <DataTable :projects="projectListStore.projects" @rowClick="navigateToProjectPage" />
    </div>

    <div v-if="projectListStore.totalPages > 1 && !projectListStore.isLoadingProjects" class="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Items per page:</span>
        <select :value="projectListStore.itemsPerPage" @change="handleItemsPerPageChange" class="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <button class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200" @click="goToPage(projectListStore.currentPage - 1)" :disabled="projectListStore.currentPage === 1">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <span class="text-sm text-gray-700">
          Page <span class="font-semibold">{{ projectListStore.currentPage }}</span> of
          <span class="font-semibold">{{ projectListStore.totalPages }}</span>
        </span>
        <button class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200" @click="goToPage(projectListStore.currentPage + 1)" :disabled="projectListStore.currentPage >= projectListStore.totalPages">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
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
