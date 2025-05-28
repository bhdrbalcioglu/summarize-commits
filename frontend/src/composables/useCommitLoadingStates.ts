import { computed } from 'vue'
import { useCommitStore } from '@/stores/commitStore'
import { useProjectContext } from './useProjectContext'
import { shouldShowSkeleton, shouldShowInlineLoading, combineLoadingStates } from '@/utils/loadingStates'

export function useCommitLoadingStates() {
  const commitStore = useCommitStore()
  const { project, status: projectStatus } = useProjectContext()

  // Convert status strings to our standard LoadingStatus type
  const branchesStatus = computed(() => {
    switch (commitStore.statusBranches) {
      case 'loading': return 'loading' as const
      case 'ready': return 'ready' as const
      case 'error': return 'error' as const
      default: return 'idle' as const
    }
  })

  const commitsStatus = computed(() => {
    switch (commitStore.statusCommits) {
      case 'loading': return 'loading' as const
      case 'ready': return 'ready' as const
      case 'error': return 'error' as const
      default: return 'idle' as const
    }
  })

  // Data availability checks
  const hasBranches = computed(() => commitStore.branches.length > 0)
  const hasCommits = computed(() => commitStore.commits.length > 0)
  const hasSelectedBranch = computed(() => commitStore.selectedBranchName !== null)

  // True only when we're actually fetching initial data and have no existing data
  const isLoadingInitialCommitData = computed(() => {
    // Project must be ready first
    if (!project.value || projectStatus.value !== 'ready') {
      return false
    }

    // We're loading initial commit data if:
    // 1. We're loading branches and have no branches yet
    // 2. We're loading commits and have no commits yet (but have a selected branch)
    return (
      shouldShowSkeleton(branchesStatus.value, hasBranches.value) ||
      (shouldShowSkeleton(commitsStatus.value, hasCommits.value) && hasSelectedBranch.value)
    )
  })

  // True when loading more commits (pagination)
  const isLoadingMoreCommits = computed(() => {
    return shouldShowInlineLoading(commitsStatus.value, hasCommits.value)
  })

  // True when we have data but are refreshing it
  const isRefreshingCommitData = computed(() => {
    return (
      shouldShowInlineLoading(branchesStatus.value, hasBranches.value) ||
      shouldShowInlineLoading(commitsStatus.value, hasCommits.value)
    )
  })

  // True when we should show the main skeleton (no data exists and we're loading)
  const shouldShowMainSkeleton = computed(() => {
    return projectStatus.value === 'loading' || isLoadingInitialCommitData.value
  })

  // True when we should show inline loading indicators
  const shouldShowInlineLoadingIndicators = computed(() => {
    return isLoadingMoreCommits.value || isRefreshingCommitData.value
  })

  // True when commit data is ready to display
  const isCommitDataReady = computed(() => {
    return (
      project.value &&
      projectStatus.value === 'ready' &&
      branchesStatus.value === 'ready' &&
      hasBranches.value
    )
  })

  // Overall loading state combining all commit-related operations
  const overallCommitStatus = computed(() => {
    if (projectStatus.value !== 'ready') return projectStatus.value
    return combineLoadingStates(branchesStatus.value, commitsStatus.value)
  })

  return {
    // Individual states
    isLoadingInitialCommitData,
    isLoadingMoreCommits,
    isRefreshingCommitData,
    
    // UI decision helpers
    shouldShowMainSkeleton,
    shouldShowInlineLoading: shouldShowInlineLoadingIndicators,
    isCommitDataReady,
    
    // Status information
    branchesStatus,
    commitsStatus,
    overallCommitStatus,
    
    // Data availability
    hasBranches,
    hasCommits,
    hasSelectedBranch
  }
} 