<!-- frontend/src/components/CompactProjectCard.vue -->
<template>
  <div class="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:border-border/50 transition-all duration-300 hover:bg-card/60 cursor-pointer" @click="navigateToProject">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <!-- Provider Icon -->
        <div class="flex-shrink-0">
          <svg v-if="project.provider === 'github'" class="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="project.provider === 'gitlab'" class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M19.13 10.13l-1.07-3.28L16.8 2.7a.426.426 0 00-.81 0l-1.26 4.15H5.27L4.01 2.7a.426.426 0 00-.81 0L1.94 6.85.87 10.13a.851.851 0 00.31.95l9.32 6.77a.426.426 0 00.5 0l9.32-6.77a.851.851 0 00.31-.95z" />
          </svg>
        </div>

        <!-- Project Info -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-foreground truncate" :title="project.name">
            {{ project.name }}
          </h4>
          <p v-if="project.description" class="text-xs text-muted-foreground truncate mt-1" :title="project.description">
            {{ project.description }}
          </p>
          <p v-else class="text-xs text-muted-foreground italic mt-1">No description</p>
        </div>
      </div>

      <!-- Stats and Activity -->
      <div class="flex items-center space-x-3 flex-shrink-0 text-xs text-muted-foreground">
        <!-- Stars and Forks -->
        <div class="flex items-center space-x-2">
          <span v-if="project.star_count !== undefined" class="flex items-center space-x-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{{ project.star_count }}</span>
          </span>
          <span v-if="project.forks_count !== undefined" class="flex items-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{{ project.forks_count }}</span>
          </span>
        </div>

        <!-- Last Activity -->
        <div v-if="project.last_activity_at" class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ timeAgo(project.last_activity_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '../types/project'

const props = defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const router = useRouter()

const navigateToProject = () => {
  // Use the same logic as ProjectsView.vue for navigation
  const projectIdentifier = props.project.provider === 'github' ? props.project.path_with_namespace : props.project.id

  router.push({
    name: 'ProjectPage',
    params: { projectIdentifier: String(projectIdentifier) }
  })
}

const timeAgo = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`
    return `${Math.floor(diffInSeconds / 31536000)}y`
  } catch (e) {
    return 'unknown'
  }
}
</script>

<style scoped>
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
