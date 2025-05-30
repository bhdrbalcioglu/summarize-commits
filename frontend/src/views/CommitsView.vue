<!-- frontend\src\views\CommitsView.vue -->
<template>
  <div class="min-h-screen bg-background">
    <!-- Modern backdrop with subtle pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

    <div class="relative p-4 sm:p-6 lg:p-8">
      <!-- Main content card container with glassmorphism -->
      <div class="max-w-7xl mx-auto">
        <div class="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 p-6 lg:p-8">
          <!-- Main skeleton - only show when actually loading initial data -->
          <div v-if="shouldShowMainSkeleton" class="mb-6">
            <SkeletonForCommits />
          </div>

          <!-- Project loading error -->
          <div v-else-if="status === 'error'" class="mb-6">
            <div class="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-center space-x-3">
              <i class="fa-solid fa-exclamation-triangle text-lg"></i>
              <span class="font-medium">Error loading project: {{ projectStore.projectError }}</span>
            </div>
          </div>

          <!-- No project available -->
          <div v-else-if="!project" class="mb-6">
            <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-200 rounded-lg p-4 flex items-center space-x-3">
              <i class="fa-solid fa-info-circle text-lg"></i>
              <span class="font-medium">No project selected or project data is not available. Please select a project.</span>
            </div>
          </div>

          <!-- Main content when project is ready -->
          <div v-else>
            <!-- Controls section -->
            <div class="bg-muted/30 rounded-lg p-4 mb-6 border border-border/30">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                <div class="w-full md:w-auto">
                  <BranchSelector />
                  <div v-if="commitStore.statusBranches === 'error'" class="mt-2 text-xs text-destructive">
                    {{ commitStore.errorMsgBranches }}
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-x-2 gap-y-3 w-full md:w-auto mt-4 md:mt-0">
                  <CustomPopover @select-last-30-days="handleDateRange('last30days')" @select-last-90-days="handleDateRange('last90days')" @select-custom-date="handleCustomDateRange" />
                  <select v-model="aiResponseStore.targetLanguage" @change="handleLanguageChange($event)" class="w-full sm:w-auto bg-muted text-foreground border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 px-4 py-2 hover:shadow-md">
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
                  <Button class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 shadow-md transition-all duration-200 flex items-center w-full sm:w-auto justify-center hover:shadow-lg transform hover:scale-105" @click="triggerAIProcessing" :disabled="commitStore.selectedCommitIdsForAI.length === 0 || aiResponseStore.isLoadingAnalysis || aiResponseStore.isLoadingNotesGeneration">
                    <i class="fas fa-file-alt mr-2"></i>
                    <span>Summarize ({{ commitStore.selectedCommitIdsForAI.length }})</span>
                  </Button>
                </div>
              </div>
            </div>

            <!-- Content section -->
            <div class="bg-background/50 rounded-lg border border-border/30 overflow-hidden">
              <!-- Loading initial commits -->
              <div v-if="isLoadingInitialCommitData" class="p-12 text-center">
                <div class="flex flex-col items-center space-y-4">
                  <div class="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center animate-pulse">
                    <i class="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
                  </div>
                  <p class="text-muted-foreground font-medium">Loading commits...</p>
                </div>
              </div>

              <!-- Commit loading error -->
              <div v-else-if="commitStore.statusCommits === 'error'" class="p-6">
                <div class="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-exclamation-triangle text-lg"></i>
                    <span class="font-medium">Error loading commits: {{ commitStore.errorMsgCommits }}</span>
                  </div>
                  <button @click="initializeCommitData" class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"><i class="fa-solid fa-refresh mr-2"></i>Retry</button>
                </div>
              </div>

              <!-- Commits table -->
              <DataTable v-else-if="project && commitStore.selectedBranchName" :commits="commitStore.commits" :selectedCommitIds="commitStore.selectedCommitIdsForAI" @toggle-selection="handleToggleCommitSelection" />

              <!-- No branch selected -->
              <div v-else-if="project && !commitStore.selectedBranchName && commitStore.statusBranches !== 'loading'" class="p-12 text-center">
                <div class="flex flex-col items-center space-y-4">
                  <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-code-branch text-2xl text-muted-foreground"></i>
                  </div>
                  <h3 class="text-lg font-semibold text-foreground">No branch selected</h3>
                  <p class="text-muted-foreground max-w-md">Please select a branch to view commits.</p>
                </div>
              </div>

              <!-- No commits found -->
              <div v-else-if="commitStore.commits.length === 0 && !isLoadingInitialCommitData && project && commitStore.selectedBranchName && commitStore.statusCommits === 'ready'" class="p-12 text-center">
                <div class="flex flex-col items-center space-y-4">
                  <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-code-commit text-2xl text-muted-foreground"></i>
                  </div>
                  <h3 class="text-lg font-semibold text-foreground">No commits found</h3>
                  <p class="text-muted-foreground max-w-md">No commits found for this branch and period. Try adjusting your date range or check another branch.</p>
                </div>
              </div>
            </div>

            <!-- Enhanced Load more / pagination controls -->
            <div class="mt-8">
              <div v-if="commitStore.isMoreCommits && project && commitStore.selectedBranchName" class="bg-muted/30 rounded-lg p-4 border border-border/30 flex justify-center">
                <Button @click="handleLoadMoreCommits" variant="outline" :disabled="isLoadingMoreCommits" class="px-6 py-3 transition-all duration-200 hover:shadow-md hover:scale-105">
                  <span v-if="isLoadingMoreCommits" class="flex items-center"> <i class="fas fa-spinner fa-spin mr-2"></i>Loading... </span>
                  <span v-else class="flex items-center"> <i class="fa-solid fa-chevron-down mr-2"></i>Load More Commits </span>
                </Button>
              </div>
              <div v-else-if="!commitStore.isMoreCommits && commitStore.commits.length > 0" class="text-center">
                <div class="bg-muted/20 rounded-lg p-4 border border-border/20">
                  <p class="text-muted-foreground text-sm font-medium">
                    <i class="fa-solid fa-check-circle mr-2"></i>
                    All commits loaded
                  </p>
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
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useCommitStore } from '../stores/commitStore'
import { useAiResponseStore } from '../stores/aiResponseStore'
import { useProjectContext } from '../composables/useProjectContext'
import { useCommitLoadingStates } from '../composables/useCommitLoadingStates'
import { useEventBus } from '@/utils/eventBus'
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
const { isLoadingInitialCommitData, isLoadingMoreCommits, shouldShowMainSkeleton } = useCommitLoadingStates()

// Event-driven initialization
const { on, cleanup } = useEventBus()

const initializeEventListeners = () => {
  // Listen for project events to initialize commit data
  on('PROJECT_LOADED', async ({ project }) => {
    if (authStore.isUserAuthenticated) {
      await initializeCommitData()
    }
  })

  // Listen for branch events to handle UI updates
  on('BRANCH_SELECTED', ({ branch }) => {
    // UI will automatically update via reactive state
    console.log(`Branch selected: ${branch.name}`)
  })

  on('DEFAULT_BRANCH_SELECTED', ({ branch }) => {
    console.log(`Default branch selected: ${branch.name}`)
  })

  // Listen for commit events
  on('COMMITS_LOADED', ({ commits, hasMore }) => {
    console.log(`Loaded ${commits.length} commits, hasMore: ${hasMore}`)
  })

  on('COMMIT_SELECTION_CHANGED', ({ commitId, isSelected }) => {
    console.log(`Commit ${commitId} ${isSelected ? 'selected' : 'deselected'}`)
  })
}

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
  initializeEventListeners()

  // Router guard ensures project is loaded, so initialize commit data
  if (project.value && status.value === 'ready') {
    initializeCommitData()
  }
})

onUnmounted(() => {
  cleanup()
})

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
  console.log('🚀 [CommitsView] AI Processing triggered')
  console.log('📊 [CommitsView] Selected commit IDs:', commitStore.selectedCommitIdsForAI)
  console.log('🌐 [CommitsView] Target language:', aiResponseStore.targetLanguage)
  console.log('👤 [CommitsView] Include author:', aiResponseStore.isAuthorInclusionEnabled)

  if (commitStore.selectedCommitIdsForAI.length === 0) {
    console.log('❌ [CommitsView] No commits selected')
    alert('Please select at least one commit to summarize.')
    return
  }

  // Navigate immediately for better UX
  console.log('🎯 [CommitsView] Navigating to CommitSummaries immediately...')
  router.push({ name: 'CommitSummaries' })

  // Start AI processing in background
  console.log('⏳ [CommitsView] Starting processCommitsAndGenerateNotes in background...')

  try {
    // processCommitsAndGenerateNotes will internally call prepareCommitBundlesForAI
    await aiResponseStore.processCommitsAndGenerateNotes()

    console.log('✅ [CommitsView] AI processing completed')
    console.log('🔍 [CommitsView] Analysis error:', aiResponseStore.errorAnalysis)
    console.log('🔍 [CommitsView] Notes error:', aiResponseStore.errorNotesGeneration)

    if (aiResponseStore.errorAnalysis || aiResponseStore.errorNotesGeneration) {
      console.log('❌ [CommitsView] Errors occurred during AI processing')
      // Errors will be displayed on the summary page via store state
    }
  } catch (error) {
    console.error('💥 [CommitsView] Unexpected error in triggerAIProcessing:', error)
    // Error will be handled and displayed on the summary page
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
