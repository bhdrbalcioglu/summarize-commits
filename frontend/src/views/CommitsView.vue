<!-- frontend\src\views\CommitsView.vue -->
<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div class="flex-1 p-6">
      <!-- Main skeleton - only show when actually loading initial data -->
      <div v-if="shouldShowMainSkeleton" class="mb-6">
        <SkeletonForCommits />
      </div>
      
      <!-- Project loading error -->
      <div v-else-if="status === 'error'" class="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
        Error loading project: {{ projectStore.projectError }}
      </div>
      
      <!-- No project available -->
      <div v-else-if="!project" class="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-md">
        No project selected or project data is not available. Please select a project.
      </div>

      <!-- Main content when project is ready -->
      <div v-else class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div class="w-full md:w-auto">
            <BranchSelector />
            <div v-if="commitStore.statusBranches === 'error'" class="mt-2 text-xs text-red-500">
              {{ commitStore.errorMsgBranches }}
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-x-2 gap-y-3 w-full md:w-auto mt-4 md:mt-0">
            <CustomPopover @select-last-30-days="handleDateRange('last30days')" @select-last-90-days="handleDateRange('last90days')" @select-custom-date="handleCustomDateRange" />
            <select v-model="aiResponseStore.targetLanguage" @change="handleLanguageChange($event)" class="w-full sm:w-auto bg-gray-100 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 px-4 py-2">
              <option value="english">English</option>
              <option value="turkish">Turkish</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="german">German</option>
            </select>
            <div class="flex items-center gap-x-2 pt-2 sm:pt-0 w-full sm:w-auto">
              <Checkbox id="authorIncludedCheckbox" :checked="aiResponseStore.isAuthorInclusionEnabled" @update:checked="toggleAuthorIncluded" />
              <div class="grid leading-none">
                <label for="authorIncludedCheckbox" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Include author</label>
                <p class="text-xs text-muted-foreground">Group notes by author.</p>
              </div>
            </div>
            <Button class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 shadow-md transition duration-200 flex items-center w-full sm:w-auto justify-center" @click="triggerAIProcessing" :disabled="commitStore.selectedCommitIdsForAI.length === 0 || aiResponseStore.isLoadingAnalysis || aiResponseStore.isLoadingNotesGeneration">
              <i class="fas fa-file-alt mr-2"></i>
              <span>Summarize ({{ commitStore.selectedCommitIdsForAI.length }})</span>
            </Button>
          </div>
        </div>

        <!-- Loading initial commits -->
        <div v-if="isLoadingInitialCommitData" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-xl text-gray-500"></i> Loading commits...
        </div>
        
        <!-- Commit loading error -->
        <div v-else-if="commitStore.statusCommits === 'error'" class="my-4 p-3 bg-red-100 text-red-600 rounded-md">
          Error loading commits: {{ commitStore.errorMsgCommits }}
        </div>
        
        <!-- Commits table -->
        <DataTable v-else-if="project && commitStore.selectedBranchName" :commits="commitStore.commits" :selectedCommitIds="commitStore.selectedCommitIdsForAI" @toggle-selection="handleToggleCommitSelection" />
        
        <!-- No branch selected -->
        <div v-else-if="project && !commitStore.selectedBranchName && commitStore.statusBranches !== 'loading'" class="text-center py-4 text-gray-500">
          Please select a branch to view commits.
        </div>

        <!-- Load more / pagination controls -->
        <div class="mt-4 flex justify-center">
          <Button v-if="commitStore.isMoreCommits && project && commitStore.selectedBranchName" @click="handleLoadMoreCommits" variant="outline" :disabled="isLoadingMoreCommits">
            <span v-if="isLoadingMoreCommits">
              <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
            </span>
            <span v-else>Load More Commits</span>
          </Button>
          <span v-else-if="!commitStore.isMoreCommits && commitStore.commits.length > 0" class="text-gray-500 text-sm"> 
            No more commits to load. 
          </span>
          <span v-else-if="commitStore.commits.length === 0 && !isLoadingInitialCommitData && project && commitStore.selectedBranchName && commitStore.statusCommits !== 'error'" class="text-gray-500 text-sm"> 
            No commits found for this branch and period. 
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useCommitStore } from '../stores/commitStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { useProjectContext } from '../composables/useProjectContext'
import { useCommitLoadingStates } from '../composables/useCommitLoadingStates'
import SkeletonForCommits from '../components/SkeletonForCommits.vue'
import DataTable from '../components/commits/DataTable.vue'
import { Checkbox } from '../components/ui/checkbox'
import BranchSelector from '../components/commits/BranchSelector.vue'
import CustomPopover from '../components/commits/CustomPopover.vue'
import { Button } from '../components/ui/button'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const commitStore = useCommitStore()
const aiResponseStore = useAiResponseStore()
const router = useRouter()

// Use the new composables
const { project, status } = useProjectContext()
const { 
  isLoadingInitialCommitData,
  isLoadingMoreCommits,
  shouldShowMainSkeleton
} = useCommitLoadingStates()

const initializeCommitData = async () => {
  if (!project.value || !authStore.isUserAuthenticated) {
    return
  }

  // Initialize commit data when project is available
  if (commitStore.branches.length === 0 && commitStore.statusBranches !== 'loading') {
    await commitStore.fetchBranchesForProject()
  } else if (commitStore.selectedBranchName && commitStore.commits.length === 0 && commitStore.statusCommits !== 'loading') {
    await commitStore.fetchCommitsForCurrentBranch()
  }
}

onMounted(() => {
  // Router guard ensures project is loaded, so initialize commit data
  if (project.value && status.value === 'ready') {
    initializeCommitData()
  }
})

// Watch for project changes - when project becomes ready, initialize commit data
watch(
  () => ({ project: project.value, status: status.value }),
  ({ project: newProject, status: newStatus }) => {
    if (newProject && newStatus === 'ready' && authStore.isUserAuthenticated) {
      initializeCommitData()
    }
  },
  { immediate: true }
)

const handleLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  aiResponseStore.setTargetLanguage(target.value)
}

const toggleAuthorIncluded = (value: boolean) => {
  aiResponseStore.setIsAuthorInclusionEnabled(value)
}

const handleToggleCommitSelection = (commitId: string) => {
  commitStore.toggleCommitSelectionForAI(commitId)
}

const handleLoadMoreCommits = () => {
  commitStore.loadMoreCommits()
}

const triggerAIProcessing = async () => {
  if (commitStore.selectedCommitIdsForAI.length === 0) {
    alert('Please select at least one commit to summarize.')
    return
  }
  // processCommitsAndGenerateNotes will internally call prepareCommitBundlesForAI
  await aiResponseStore.processCommitsAndGenerateNotes()
  if (!aiResponseStore.errorAnalysis && !aiResponseStore.errorNotesGeneration) {
    router.push({ name: 'CommitSummaries' }) // Navigate on success
  } else {
    // Errors are shown in aiResponseStore state, UI can react or show alerts
    alert('An error occurred during AI processing. Check console or error messages.')
  }
}

const handleDateRange = (rangeType: 'last30days' | 'last90days') => {
  const now = new Date()
  const since = new Date()
  if (rangeType === 'last30days') {
    since.setDate(now.getDate() - 30)
  } else {
    // last90days
    since.setDate(now.getDate() - 90)
  }
  commitStore.setCommitFilters({
    since: since.toISOString().split('T')[0], // YYYY-MM-DD
    until: now.toISOString().split('T')[0] // YYYY-MM-DD
  })
}

const handleCustomDateRange = (dates: { start: Date | null; end: Date | null }) => {
  commitStore.setCommitFilters({
    since: dates.start ? dates.start.toISOString().split('T')[0] : null,
    until: dates.end ? dates.end.toISOString().split('T')[0] : null
  })
}
</script>
