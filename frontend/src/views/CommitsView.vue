<!-- frontend\src\views\CommitsView.vue -->
<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <!-- Project Card: Assuming it's part of ProjectPageView layout, not directly here -->
    <!-- If needed here, it would bind to projectStore.activeProject -->

    <div class="flex-1 p-6">
      <div v-if="projectStore.isLoadingProject || (isLoadingInitialData && !projectStore.projectError)" class="mb-6">
        <SkeletonForCommits />
      </div>
      <div v-else-if="projectStore.projectError" class="mb-6 p-4 bg-red-100 text-red-700 rounded-md">Error loading project: {{ projectStore.projectError }}</div>
      <div v-else-if="!projectStore.activeProject" class="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-md">No project selected or project data is not available. Please select a project.</div>

      <div v-else class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div class="w-full md:w-auto">
            <BranchSelector />
            <div v-if="commitStore.errorBranches" class="mt-2 text-xs text-red-500">{{ commitStore.errorBranches }}</div>
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

        <div v-if="commitStore.isLoadingCommits && commitStore.commits.length === 0" class="text-center py-4"><i class="fas fa-spinner fa-spin text-xl text-gray-500"></i> Loading commits...</div>
        <div v-else-if="commitStore.errorCommits" class="my-4 p-3 bg-red-100 text-red-600 rounded-md">Error loading commits: {{ commitStore.errorCommits }}</div>
        <DataTable v-else-if="projectStore.activeProject && commitStore.selectedBranchName" :commits="commitStore.commits" :selectedCommitIds="commitStore.selectedCommitIdsForAI" @toggle-selection="handleToggleCommitSelection" />
        <div v-else-if="projectStore.activeProject && !commitStore.selectedBranchName && !commitStore.isLoadingBranches" class="text-center py-4 text-gray-500">Please select a branch to view commits.</div>

        <div class="mt-4 flex justify-center">
          <Button v-if="commitStore.isMoreCommits && projectStore.activeProject && commitStore.selectedBranchName" @click="handleLoadMoreCommits" variant="outline" :disabled="commitStore.isLoadingCommits">
            {{ commitStore.isLoadingCommits && commitStore.commits.length > 0 ? 'Loading...' : 'Load More Commits' }}
          </Button>
          <span v-else-if="!commitStore.isMoreCommits && commitStore.commits.length > 0" class="text-gray-500 text-sm"> No more commits to load. </span>
          <span v-else-if="commitStore.commits.length === 0 && !commitStore.isLoadingCommits && projectStore.activeProject && commitStore.selectedBranchName && !commitStore.errorCommits" class="text-gray-500 text-sm"> No commits found for this branch and period. </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useCommitStore } from '../stores/commitStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
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
const route = useRoute()
const router = useRouter()

const isLoadingInitialData = ref(true)

const projectIdentifierFromRoute = computed(() => {
  const param = route.params.projectIdentifier
  return Array.isArray(param) ? param[0] : param
})

const initializeViewData = async () => {
  isLoadingInitialData.value = true
  if (!authStore.isUserAuthenticated) {
    // Should be handled by router guards, but good for robustness
    router.push({ name: 'Home' })
    isLoadingInitialData.value = false
    return
  }

  const identifier = projectIdentifierFromRoute.value
  if (identifier) {
    // Fetch project details if not already loaded or if ID mismatch
    if (!projectStore.activeProject || (projectStore.activeProject.provider === 'github' && projectStore.activeProject.path_with_namespace !== identifier) || (projectStore.activeProject.provider === 'gitlab' && String(projectStore.activeProject.id) !== identifier)) {
      await projectStore.fetchProjectDetails(identifier)
    }
  } else if (!projectStore.activeProject) {
    console.warn('CommitsView: No project identifier in route and no active project in store.')
    // router.push({ name: 'ProjectsView' }); // Or some error state
    isLoadingInitialData.value = false
    return
  }

  // Once project is confirmed or loaded:
  if (projectStore.activeProject) {
    if (commitStore.branches.length === 0 && !commitStore.isLoadingBranches) {
      await commitStore.fetchBranchesForProject() // This will auto-select branch and fetch commits if successful
    } else if (commitStore.selectedBranchName && commitStore.commits.length === 0 && !commitStore.isLoadingCommits) {
      // If branch is selected but commits are empty (e.g. navigating back)
      await commitStore.fetchCommitsForCurrentBranch()
    }
  }
  isLoadingInitialData.value = false
}

// Clean up commit store when leaving the route
onBeforeRouteLeave(() => {
  commitStore.resetCommitState()
  aiResponseStore.resetAiState()
})

onMounted(() => {
  initializeViewData()
})

watch(
  () => projectIdentifierFromRoute.value,
  (newIdentifier, oldIdentifier) => {
    if (newIdentifier && newIdentifier !== oldIdentifier) {
      commitStore.resetCommitState() // Reset commits when project changes
      projectStore.resetProjectState() // Reset project details
      initializeViewData()
    }
  }
)

watch(
  () => authStore.isUserAuthenticated,
  (isAuth) => {
    if (isAuth && projectIdentifierFromRoute.value) {
      initializeViewData() // Re-initialize if user logs in while on this page
    } else if (!isAuth) {
      commitStore.resetCommitState()
      projectStore.resetProjectState()
    }
  }
)

// Watch for project changes - when project is loaded, initialize commit data
watch(
  () => projectStore.activeProject,
  (newProject) => {
    if (newProject && authStore.isUserAuthenticated) {
      // Initialize commit data when project becomes available
      if (commitStore.branches.length === 0 && !commitStore.isLoadingBranches) {
        commitStore.fetchBranchesForProject()
      } else if (commitStore.selectedBranchName && commitStore.commits.length === 0 && !commitStore.isLoadingCommits) {
        commitStore.fetchCommitsForCurrentBranch()
      }
      isLoadingInitialData.value = false
    } else if (!newProject) {
      isLoadingInitialData.value = true
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
