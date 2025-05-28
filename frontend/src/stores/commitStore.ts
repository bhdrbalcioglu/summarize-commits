// frontend/src/stores/commitStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Commit, Branch } from '../types/commit'
import { commitService } from '../services/commitService'
import { useAuthStore } from './authStore'
import { useProjectStore } from './projectStore'
import { eventBus } from '@/utils/eventBus'
import apiClient from '@/services/apiService'
// Assuming types align with backend definitions (backend/src/types/git.types.ts)
import type { BackendCommitBundleItem, CommitDetail } from '@/types/commit' // Adjust path if necessary

export type CommitStatus = 'idle' | 'loading' | 'ready' | 'error'

// For pagination and filtering of commits, similar to backend's CommitListParams
export interface FetchCommitsParams {
  branch?: string | null
  page?: number
  perPage?: number
  since?: string | null // ISO 8601 string
  until?: string | null // ISO 8601 string
  // GitHub specific:
  author?: string
  path?: string
}

// Expected response structure for commit list from backend
// (matches backend/src/types/git.types.ts -> CommitListResponse)
export interface BackendCommitListResponse {
  commits: Commit[]
  totalCommits?: number
  isMore?: boolean
  currentPage?: number
  // perPage?: number; // Backend might echo this back
}

// Expected response for commit bundles for AI (matches BackendCommitBundleItem array)
// type BackendCommitsBundleResponse = BackendCommitBundleItem[];

export interface CommitState {
  branches: Branch[]
  selectedBranchName: string | null // Store only the name, actual branch object can be a getter
  commits: Commit[]
  selectedCommitIdsForAI: string[]
  // commitBundlesForAI: BackendCommitBundleItem[]; // Store result from AI analysis in aiResponseStore

  statusBranches: CommitStatus
  statusCommits: CommitStatus
  statusCommitBundles: CommitStatus

  currentPage: number
  perPage: number
  totalCommits: number // From backend if available
  isMoreCommits: boolean
  sinceDate: string | null
  untilDate: string | null

  errorMsgBranches: string | null
  errorMsgCommits: string | null
  errorMsgCommitBundles: string | null
}

export const useCommitStore = defineStore('commit', () => {
  // State
  const branches = ref<Branch[]>([])
  const commits = ref<Commit[]>([])
  const selectedBranchName = ref<string | null>(null)
  const selectedCommitIdsForAI = ref<string[]>([])
  const isMoreCommits = ref<boolean>(false)
  const currentPage = ref<number>(1)
  const commitFilters = ref<{
    since?: string | null
    until?: string | null
    author?: string | null
  }>({})

  // Status tracking
  const statusBranches = ref<CommitStatus>('idle')
  const statusCommits = ref<CommitStatus>('idle')
  const statusCommitBundles = ref<CommitStatus>('idle')

  // Error messages
  const errorMsgBranches = ref<string | null>(null)
  const errorMsgCommits = ref<string | null>(null)
  const errorMsgCommitBundles = ref<string | null>(null)

  // Getters
  const activeBranch = computed(() => {
    return branches.value.find(branch => branch.name === selectedBranchName.value) || null
  })

  const defaultBranch = computed(() => {
    return branches.value.find(branch => branch.is_default) || branches.value[0] || null
  })

  const isLoadingBranches = computed(() => statusBranches.value === 'loading')
  const isLoadingCommits = computed(() => statusCommits.value === 'loading')

  // Helper function to get project identifier for API calls
  const getProjectIdentifier = (project: any): string => {
    const authStore = useAuthStore()
    if (authStore.currentProvider === 'github') {
      return project.path_with_namespace || `${project.namespace?.name}/${project.name}`
    }
    return String(project.id)
  }

  // Event-driven actions
  const initializeEventListeners = () => {
    // Listen for project events
    eventBus.on('PROJECT_LOADED', async ({ project }) => {
      await handleProjectLoaded(getProjectIdentifier(project))
    })

    eventBus.on('BRANCH_SELECTED', async ({ branch, projectId }) => {
      await handleBranchSelected(branch.name, projectId)
    })

    eventBus.on('DEFAULT_BRANCH_SELECTED', async ({ branch, projectId }) => {
      await handleBranchSelected(branch.name, projectId)
    })

    eventBus.on('COMMIT_FILTERS_CHANGED', async ({ filters }) => {
      await handleFiltersChanged(filters)
    })
  }

  // Event handlers
  const handleProjectLoaded = async (projectId: string) => {
    if (branches.value.length === 0) {
      await fetchBranchesForProject()
    }
  }

  const handleBranchSelected = async (branchName: string, projectId: string) => {
    if (selectedBranchName.value !== branchName) {
      selectedBranchName.value = branchName
      // Reset commits when branch changes
      commits.value = []
      currentPage.value = 1
      selectedCommitIdsForAI.value = []
      await fetchCommitsForCurrentBranch()
    }
  }

  const handleFiltersChanged = async (filters: Record<string, any>) => {
    commitFilters.value = { ...commitFilters.value, ...filters }
    // Reset and refetch commits with new filters
    commits.value = []
    currentPage.value = 1
    if (selectedBranchName.value) {
      await fetchCommitsForCurrentBranch()
    }
  }

  // Actions
  const fetchBranchesForProject = async () => {
    const authStore = useAuthStore()
    const projectStore = useProjectStore()

    if (!authStore.isUserAuthenticated || !projectStore.currentProject) {
      return
    }

    try {
      statusBranches.value = 'loading'
      errorMsgBranches.value = null

      const projectId = getProjectIdentifier(projectStore.currentProject)

      await eventBus.emit('BRANCHES_LOADING_STARTED', { 
        projectId 
      })

      const fetchedBranches = await commitService.fetchBranches(projectId)
      
      branches.value = fetchedBranches
      statusBranches.value = 'ready'

      await eventBus.emit('BRANCHES_LOADED', { 
        branches: fetchedBranches, 
        projectId 
      })

      // Auto-select default branch if none selected
      if (!selectedBranchName.value && defaultBranch.value) {
        await selectBranch(defaultBranch.value.name)
      }

    } catch (error: any) {
      statusBranches.value = 'error'
      errorMsgBranches.value = error.message || 'Failed to fetch branches'
      
      const projectId = getProjectIdentifier(projectStore.currentProject)
      await eventBus.emit('BRANCHES_LOADING_FAILED', { 
        error: errorMsgBranches.value || 'Failed to fetch branches', 
        projectId 
      })
    }
  }

  const selectBranch = async (branchName: string) => {
    const projectStore = useProjectStore()
    const branch = branches.value.find(b => b.name === branchName)
    
    if (!branch || !projectStore.currentProject) {
      return false
    }

    const isDefault = branch.is_default
    const eventType = isDefault ? 'DEFAULT_BRANCH_SELECTED' : 'BRANCH_SELECTED'
    const projectId = getProjectIdentifier(projectStore.currentProject)
    
    await eventBus.emit(eventType, { 
      branch, 
      projectId 
    })

    return true
  }

  const fetchCommitsForCurrentBranch = async () => {
    const authStore = useAuthStore()
    const projectStore = useProjectStore()

    if (!authStore.isUserAuthenticated || !projectStore.currentProject || !selectedBranchName.value) {
      return
    }

    const branchName = selectedBranchName.value
    if (!branchName) {
      return
    }

    try {
      statusCommits.value = 'loading'
      errorMsgCommits.value = null

      const projectId = getProjectIdentifier(projectStore.currentProject)

      await eventBus.emit('COMMITS_LOADING_STARTED', { 
        branchName, 
        projectId 
      })

      const result = await commitService.fetchCommits(
        projectId,
        branchName,
        currentPage.value,
        commitFilters.value
      )

      if (currentPage.value === 1) {
        commits.value = result.commits
      } else {
        commits.value.push(...result.commits)
      }

      isMoreCommits.value = result.hasMore
      statusCommits.value = 'ready'

      await eventBus.emit('COMMITS_LOADED', { 
        commits: result.commits, 
        branchName, 
        projectId,
        hasMore: result.hasMore
      })

    } catch (error: any) {
      statusCommits.value = 'error'
      errorMsgCommits.value = error.message || 'Failed to fetch commits'
      
      const projectId = getProjectIdentifier(projectStore.currentProject)
      
      await eventBus.emit('COMMITS_LOADING_FAILED', { 
        error: errorMsgCommits.value || 'Failed to fetch commits', 
        branchName, 
        projectId 
      })
    }
  }

  const loadMoreCommits = async () => {
    if (!isMoreCommits.value || statusCommits.value === 'loading') {
      return
    }

    currentPage.value += 1
    await fetchCommitsForCurrentBranch()
  }

  const toggleCommitSelectionForAI = async (commitId: string) => {
    const index = selectedCommitIdsForAI.value.indexOf(commitId)
    const isSelected = index === -1

    if (isSelected) {
      selectedCommitIdsForAI.value.push(commitId)
    } else {
      selectedCommitIdsForAI.value.splice(index, 1)
    }

    await eventBus.emit('COMMIT_SELECTION_CHANGED', { 
      commitId, 
      isSelected 
    })
  }

  const setCommitFilters = async (filters: typeof commitFilters.value) => {
    await eventBus.emit('COMMIT_FILTERS_CHANGED', { filters })
  }

  const resetCommitState = () => {
    commits.value = []
    selectedCommitIdsForAI.value = []
    currentPage.value = 1
    isMoreCommits.value = false
    statusCommits.value = 'idle'
    errorMsgCommits.value = null
    commitFilters.value = {}
  }

  const resetBranchState = () => {
    branches.value = []
    selectedBranchName.value = null
    statusBranches.value = 'idle'
    errorMsgBranches.value = null
  }

  const resetAllState = () => {
    resetCommitState()
    resetBranchState()
    statusCommitBundles.value = 'idle'
    errorMsgCommitBundles.value = null
  }

  // Pinia reset method
  const $reset = () => {
    resetAllState()
  }

  // Initialize event listeners when store is created
  initializeEventListeners()

  return {
    // State
    branches,
    commits,
    selectedBranchName,
    selectedCommitIdsForAI,
    isMoreCommits,
    currentPage,
    commitFilters,

    // Status
    statusBranches,
    statusCommits,
    statusCommitBundles,

    // Errors
    errorMsgBranches,
    errorMsgCommits,
    errorMsgCommitBundles,

    // Getters
    activeBranch,
    defaultBranch,
    isLoadingBranches,
    isLoadingCommits,

    // Actions
    fetchBranchesForProject,
    selectBranch,
    fetchCommitsForCurrentBranch,
    loadMoreCommits,
    toggleCommitSelectionForAI,
    setCommitFilters,
    resetCommitState,
    resetBranchState,
    resetAllState,
    $reset
  }
})
