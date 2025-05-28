<!-- frontend\src\components\ProjectCard.vue -->
<template>
  <div class="project-card-container w-full">
    <div v-if="isLoading || !projectData" class="w-full">
      <SkeletonCard />
    </div>
    <div v-else-if="projectData" class="project-info text-center p-4 md:p-6 bg-white text-gray-800 rounded-lg shadow-md">
      <h2 class="text-xl md:text-2xl font-semibold mb-2 md:mb-4 truncate" :title="projectData.name">
        {{ projectData.name }}
      </h2>
      <h3 v-if="projectData.namespace?.name" class="text-lg md:text-xl font-medium mb-2 md:mb-4 text-gray-600 truncate" :title="projectData.namespace.name">
        {{ projectData.namespace.name }}
      </h3>
      <div class="flex items-center justify-center mt-2 text-sm md:text-base">
        <span v-if="projectData.visibility === 'public'" class="font-semibold flex items-center space-x-1 text-green-600">
          <i class="fa-solid fa-eye"></i>
          <span>Public</span>
        </span>
        <span v-else-if="projectData.visibility === 'private'" class="font-semibold flex items-center space-x-1 text-red-600">
          <i class="fa-solid fa-lock"></i>
          <span>Private</span>
        </span>
        <span v-else-if="projectData.visibility === 'internal'" class="font-semibold flex items-center space-x-1 text-blue-600">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Internal</span>
        </span>
        <span v-else class="font-semibold text-gray-500">
          {{ projectData.visibility || 'N/A' }}
        </span>
      </div>

      <p v-if="projectData.created_at" class="text-xs text-gray-500 mt-3">Created: {{ formattedDate(projectData.created_at) }}</p>

      <p v-if="projectData.default_branch" class="text-sm text-gray-600 mt-1">
        Default Branch:
        <span class="font-semibold text-gray-800">{{ projectData.default_branch }}</span>
      </p>

      <p v-if="projectData.last_activity_at" class="text-xs text-gray-500 mt-1">Last Activity: {{ formattedDate(projectData.last_activity_at) }}</p>

      <div class="mt-4 text-xs md:text-sm text-gray-700 text-left max-h-24 overflow-y-auto custom-scrollbar p-1">
        <p v-if="projectData.description">{{ projectData.description }}</p>
        <p v-else class="italic text-gray-400">No description provided.</p>
      </div>

      <div class="flex justify-center mt-4">
        <a :href="projectData.web_url" class="text-blue-600 hover:text-blue-700 text-sm underline" target="_blank" rel="noopener noreferrer"> View on {{ projectData.provider?.charAt(0).toUpperCase() + projectData.provider?.slice(1) || 'Provider' }} </a>
      </div>

      <div class="text-xs text-gray-500 mt-4 flex justify-center space-x-3">
        <span>⭐ {{ projectData.star_count ?? 0 }}</span>
        <span><i class="fa-solid fa-code-fork"></i> {{ projectData.forks_count ?? 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue'
import SkeletonCard from './SkeletonCard.vue'
import type { Project } from '../types/project' // Import your aligned Project type

const props = defineProps({
  project: {
    type: Object as PropType<Project | null>, // Allow null
    default: null // Provide a default of null
  },
  isLoading: {
    type: Boolean,
    required: true
  }
})

// Use props.project directly, no need for projectStore here
const projectData = props.project

const formattedDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
      // hour: '2-digit',
      // minute: '2-digit',
    })
  } catch (e) {
    return 'Invalid Date'
  }
}
</script>

<style scoped>
.project-card-container {
  width: 100%;
  max-width: 350px; /* Or adjust as needed */
  margin: auto;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}
</style>
