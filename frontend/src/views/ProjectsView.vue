<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">
      {{ groupName ? `${groupName} / Projects` : 'Projects' }}
    </h5>

    <div class="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-4 md:space-y-0">
      <div class="w-full md:w-1/3">
        <input type="text" v-model="searchTerm" @input="debouncedFetchProjects" placeholder="Search projects..." class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
      </div>
    </div>

    <div v-if="isLoading">
      <SkeletonTable />
    </div>
    <div v-else>
      <DataTable @rowClick="navigateToProject" />
    </div>

    <div class="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Items per page:</span>
        <select v-model="itemsPerPage" @change="fetchProjectsData" class="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <button class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200" @click="prevPage" :disabled="currentPage === 1">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <span class="text-sm text-gray-700">
          Page <span class="font-semibold">{{ currentPage }}</span> of
          <span class="font-semibold">{{ totalPages }}</span>
        </span>
        <button class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200" @click="nextPage" :disabled="currentPage === totalPages">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { debounce } from 'lodash-es'
import { fetchProjects, ProjectFetchParams } from '../services/gitlabService'
import { useProjectStore } from '../stores/project'
import { useProjectListStore } from '../stores/projectList'
import SkeletonTable from '../components/SkeletonTable.vue'
import DataTable from '../components/projects/DataTable.vue'
import type { Project } from '../types/project'

const props = defineProps({
  groupId: {
    type: String,
    required: false
  },
  groupName: {
    type: String,
    required: false
  }
})

const router = useRouter()
const projectStore = useProjectStore()
const projectListStore = useProjectListStore()
const { currentPage, itemsPerPage, totalPages, searchTerm, orderBy, sortOrder, isLoading } = storeToRefs(projectListStore)

const fetchProjectsData = async () => {
  try {
    const params: ProjectFetchParams = {
      groupId: props.groupId,
      orderBy: orderBy.value,
      sortOrder: sortOrder.value,
      itemsPerPage: itemsPerPage.value,
      currentPage: currentPage.value,
      searchTerm: searchTerm.value
    }

    const { projects: fetchedProjects, totalPages: fetchedTotalPages, totalProjects: fetchedTotalProjects } = await fetchProjects(params)

    projectListStore.setProjects(fetchedProjects)
    projectListStore.setTotalPages(fetchedTotalPages)
    projectListStore.setTotalProjects(fetchedTotalProjects)
  } catch (error) {
    console.error('Error fetching projects:', error)
  } finally {
  }
}

const debouncedFetchProjects = debounce(() => {
  projectListStore.setCurrentPage(1)
  fetchProjectsData()
}, 500)

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    projectListStore.setCurrentPage(currentPage.value + 1)
    fetchProjectsData()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    projectListStore.setCurrentPage(currentPage.value - 1)
    fetchProjectsData()
  }
}

const navigateToProject = (project: Project) => {
  projectStore.setProjectDetails(project)
  searchTerm.value = ''
  router.push({
    name: 'ProjectPage',
    params: { name: project.name, id: project.id.toString() }
  })
}

watch([orderBy, sortOrder], () => {
  fetchProjectsData()
})

onMounted(() => {
  fetchProjectsData()
})
</script>
