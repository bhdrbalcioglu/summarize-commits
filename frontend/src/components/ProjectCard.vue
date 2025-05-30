<!-- frontend\src\components\ProjectCard.vue -->
<template>
  <div class="project-card-container w-full">
    <div v-if="isLoading" class="w-full">
      <SkeletonCard />
    </div>
    <div v-else-if="projectData" class="project-info text-center p-6 bg-card/80 backdrop-blur-xl text-foreground rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02]">
      <!-- Project Header Section -->
      <div class="project-header mb-6 animate-fade-in-up">
        <h2 class="text-xl md:text-2xl font-semibold mb-2 truncate text-foreground transition-colors duration-200" :title="projectData.name">
          {{ projectData.name }}
        </h2>
        <h3 v-if="projectData.namespace?.name" class="text-lg font-medium mb-3 text-muted-foreground truncate transition-colors duration-200" :title="projectData.namespace.name">
          {{ projectData.namespace.name }}
        </h3>

        <!-- Visibility Badge -->
        <div class="flex items-center justify-center">
          <span v-if="projectData.visibility === 'public'" class="visibility-badge text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30">
            <i class="fa-solid fa-eye text-sm"></i>
            <span>Public</span>
          </span>
          <span v-else-if="projectData.visibility === 'private'" class="visibility-badge text-muted-foreground bg-muted/50 border-border">
            <i class="fa-solid fa-lock text-sm"></i>
            <span>Private</span>
          </span>
          <span v-else-if="projectData.visibility === 'internal'" class="visibility-badge text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30">
            <i class="fa-solid fa-shield-halved text-sm"></i>
            <span>Internal</span>
          </span>
          <span v-else class="visibility-badge text-muted-foreground bg-muted/50 border-border">
            {{ projectData.visibility || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Tech Stack Section -->
      <div v-if="projectData.language || projectData.license" class="tech-stack-section mb-6 animate-fade-in-up animation-delay-100">
        <div class="section-header">
          <i class="fa-solid fa-code text-primary"></i>
          <span>Tech Stack</span>
        </div>
        <div class="section-content">
          <!-- Language Badge -->
          <div v-if="projectData.language" class="tech-item">
            <span class="tech-badge border" :class="getLanguageColor(projectData.language)" :title="`Primary language: ${projectData.language}`">
              <i class="fa-solid fa-code text-xs mr-2"></i>
              {{ projectData.language }}
            </span>
          </div>

          <!-- License Badge -->
          <div v-if="projectData.license" class="tech-item">
            <span class="tech-badge bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30" :title="`License: ${projectData.license.name}`">
              <i class="fa-solid fa-scale-balanced text-xs mr-2"></i>
              {{ projectData.license.key || projectData.license.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Topics Section -->
      <div v-if="projectData.topics && projectData.topics.length > 0" class="topics-section mb-6 animate-fade-in-up animation-delay-200">
        <div class="section-header">
          <i class="fa-solid fa-tags text-primary"></i>
          <span>Topics</span>
        </div>
        <div class="section-content">
          <div class="flex flex-wrap gap-2 justify-center">
            <span v-for="(topic, index) in projectData.topics.slice(0, 6)" :key="topic" class="topic-tag" :style="{ animationDelay: `${index * 50}ms` }">
              {{ topic }}
            </span>
            <span v-if="projectData.topics.length > 6" class="topic-more"> +{{ projectData.topics.length - 6 }} more </span>
          </div>
        </div>
      </div>

      <!-- Repository Info Section -->
      <div class="repo-info-section mb-6 animate-fade-in-up animation-delay-300">
        <div class="section-header">
          <i class="fa-solid fa-info-circle text-primary"></i>
          <span>Repository Info</span>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div v-if="projectData.created_at" class="info-item">
              <i class="fa-solid fa-calendar-plus text-muted-foreground"></i>
              <span class="info-label">Created</span>
              <span class="info-value">{{ formattedDate(projectData.created_at) }}</span>
            </div>

            <div v-if="projectData.default_branch" class="info-item">
              <i class="fa-solid fa-code-branch text-muted-foreground"></i>
              <span class="info-label">Branch</span>
              <span class="info-value branch-badge">{{ projectData.default_branch }}</span>
            </div>

            <div v-if="projectData.last_activity_at" class="info-item">
              <i class="fa-solid fa-clock text-muted-foreground"></i>
              <span class="info-label">Last Activity</span>
              <span class="info-value">{{ formattedDate(projectData.last_activity_at) }}</span>
            </div>

            <div v-if="projectData.size && projectData.size > 0" class="info-item">
              <i class="fa-solid fa-database text-muted-foreground"></i>
              <span class="info-label">Size</span>
              <span class="info-value">{{ formatSize(projectData.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="description-section mb-6 animate-fade-in-up animation-delay-400">
        <div class="section-header">
          <i class="fa-solid fa-file-text text-primary"></i>
          <span>Description</span>
        </div>
        <div class="section-content">
          <div class="description-content">
            <p v-if="projectData.description" class="leading-relaxed">{{ projectData.description }}</p>
            <p v-else class="italic text-muted-foreground">No description provided.</p>
          </div>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="statistics-section mb-6 animate-fade-in-up animation-delay-500">
        <div class="section-header">
          <i class="fa-solid fa-chart-bar text-primary"></i>
          <span>Statistics</span>
        </div>
        <div class="section-content">
          <div class="stats-grid">
            <div class="stat-item" :title="`${projectData.star_count} stars`">
              <i class="fa-solid fa-star text-amber-500"></i>
              <span>{{ formatNumber(projectData.star_count ?? 0) }}</span>
            </div>
            <div class="stat-item" :title="`${projectData.forks_count} forks`">
              <i class="fa-solid fa-code-fork text-muted-foreground"></i>
              <span>{{ formatNumber(projectData.forks_count ?? 0) }}</span>
            </div>
            <div v-if="projectData.watchers_count" class="stat-item" :title="`${projectData.watchers_count} watchers`">
              <i class="fa-solid fa-eye text-muted-foreground"></i>
              <span>{{ formatNumber(projectData.watchers_count) }}</span>
            </div>
            <div v-if="projectData.open_issues_count" class="stat-item" :title="`${projectData.open_issues_count} open issues`">
              <i class="fa-solid fa-circle-exclamation text-orange-500"></i>
              <span>{{ formatNumber(projectData.open_issues_count) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="actions-section animate-fade-in-up animation-delay-600">
        <div class="action-buttons">
          <!-- Homepage Link -->
          <a v-if="projectData.homepage" :href="projectData.homepage" class="action-button secondary" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-home"></i>
            <span>Homepage</span>
            <i class="fa-solid fa-external-link text-xs opacity-60"></i>
          </a>

          <!-- Provider Link -->
          <a :href="projectData.web_url" class="action-button primary" target="_blank" rel="noopener noreferrer">
            <i :class="getProviderIcon(projectData.provider)"></i>
            <span>View on {{ projectData.provider?.charAt(0).toUpperCase() + projectData.provider?.slice(1) || 'Provider' }}</span>
            <i class="fa-solid fa-external-link text-xs opacity-60"></i>
          </a>
        </div>
      </div>

      <!-- Archived Notice -->
      <div v-if="projectData.archived" class="mt-4 animate-fade-in-up animation-delay-700">
        <span class="archived-badge">
          <i class="fa-solid fa-archive text-xs mr-2"></i>
          Archived
        </span>
      </div>
    </div>

    <div v-else class="project-info text-center p-6 bg-card/80 backdrop-blur-xl text-foreground rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-border/50">
      <div class="text-muted-foreground">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>No project data available</p>
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
    })
  } catch (e) {
    return 'Invalid Date'
  }
}

const getProviderIcon = (provider: string | undefined): string => {
  switch (provider?.toLowerCase()) {
    case 'github':
      return 'fa-brands fa-github'
    case 'gitlab':
      return 'fa-brands fa-gitlab'
    default:
      return 'fa-solid fa-code-branch'
  }
}

// Enhanced utility functions for Phase 1
const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    JavaScript: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    TypeScript: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    Python: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    Java: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    Vue: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    React: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    'C#': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    'C++': 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
    Go: 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    Rust: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
    PHP: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    Ruby: 'bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
  }
  return colors[language] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatSize = (sizeInKB: number): string => {
  if (sizeInKB >= 1024 * 1024) return (sizeInKB / (1024 * 1024)).toFixed(1) + ' GB'
  if (sizeInKB >= 1024) return (sizeInKB / 1024).toFixed(1) + ' MB'
  return sizeInKB.toFixed(0) + ' KB'
}
</script>

<style scoped>
.project-card-container {
  width: 100%;
  max-width: 380px; /* Increased from 350px for better content fit */
  margin: auto;
}

/* Animation Keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animation-delay-100 {
  animation-delay: 0.1s;
}
.animation-delay-200 {
  animation-delay: 0.2s;
}
.animation-delay-300 {
  animation-delay: 0.3s;
}
.animation-delay-400 {
  animation-delay: 0.4s;
}
.animation-delay-500 {
  animation-delay: 0.5s;
}
.animation-delay-600 {
  animation-delay: 0.6s;
}
.animation-delay-700 {
  animation-delay: 0.7s;
}

/* Section Styling */
.section-header {
  @apply flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground mb-3;
}

.section-content {
  @apply space-y-2;
}

/* Tech Stack Section */
.tech-stack-section {
  @apply p-4 bg-muted/10 rounded-lg border border-border/30;
}

.tech-item {
  @apply flex justify-center mb-2 last:mb-0;
}

.tech-badge {
  @apply inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200;
}

.tech-badge:hover {
  @apply scale-105 shadow-md;
}

/* Topics Section */
.topics-section {
  @apply p-4 bg-primary/5 rounded-lg border border-primary/10;
}

.topic-tag {
  @apply px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20 transition-all duration-200;
  animation: fadeInUp 0.4s ease-out forwards;
}

.topic-tag:hover {
  @apply bg-primary/20 scale-105;
}

.topic-more {
  @apply px-2 py-1 text-xs text-muted-foreground;
}

/* Repository Info Section */
.repo-info-section {
  @apply p-4 bg-card/40 rounded-lg border border-border/20;
}

.info-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-2;
}

.info-item {
  @apply flex items-center gap-2 text-xs p-2 rounded transition-all duration-200;
}

.info-item:hover {
  @apply bg-muted/20;
}

.info-label {
  @apply text-muted-foreground;
}

.info-value {
  @apply text-foreground font-medium;
}

.branch-badge {
  @apply text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20;
}

/* Description Section */
.description-section {
  @apply p-4 bg-muted/10 rounded-lg border border-border/20;
}

.description-content {
  @apply text-sm text-foreground text-left max-h-20 overflow-y-auto;
}

/* Statistics Section */
.statistics-section {
  @apply p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10;
}

.stats-grid {
  @apply flex justify-center gap-4 flex-wrap;
}

.stat-item {
  @apply flex items-center gap-2 text-xs p-2 rounded transition-all duration-200 cursor-default;
}

.stat-item:hover {
  @apply scale-110 bg-background/50;
}

/* Actions Section */
.action-buttons {
  @apply flex flex-col gap-3;
}

.action-button {
  @apply inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200;
}

.action-button.primary {
  @apply bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:scale-105 focus:ring-2 focus:ring-primary/20;
}

.action-button.secondary {
  @apply bg-muted/20 text-muted-foreground border border-border hover:bg-muted/30 hover:border-border/50 hover:scale-105;
}

/* Visibility Badge */
.visibility-badge {
  @apply font-semibold flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-200;
}

.visibility-badge:hover {
  @apply scale-105;
}

/* Archived Badge */
.archived-badge {
  @apply inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30;
}

/* Scrollbar Styling */
.description-content::-webkit-scrollbar {
  width: 4px;
}

.description-content::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 10px;
}

.description-content::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 10px;
}

.description-content::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>
