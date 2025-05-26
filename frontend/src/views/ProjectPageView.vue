<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div class="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col items-center">
      <ProjectCard :project="projectStore" :isLoading="projectStore.isLoading" />
    </div>

    <div class="flex-1 p-6">
      <ActionSelector @onSelectAction="handleAction" />
      <router-view />
      <!-- This will render the child route components -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import ProjectCard from '../components/ProjectCard.vue'
import ActionSelector from '../components/ActionSelector.vue'
import { fetchProjectDetails as fetchProjectDetailsService } from '@/services/gitlabService'
import { ref } from 'vue'
const projectId = ref<string | null>(null)

const router = useRouter()
const projectStore = useProjectStore()

const handleAction = (action: 'commit-summary' | 'documentation-generation') => {
  if (action === 'commit-summary') {
    router.push({ name: 'CommitsView' })
  } else if (action === 'documentation-generation') {
    router.push({ name: 'FileTreeView' })
  }
}
const fetchProjectDetails = async () => {
  try {
    projectId.value = projectStore.projectId?.toString() || null
    if (projectId.value) {
      await fetchProjectDetailsService(projectId.value)
    }
  } catch (error) {
    const errorMessage = 'Failed to fetch project details'
  }
}

onMounted(() => {
  handleAction('commit-summary')
  fetchProjectDetails()
})
</script>
