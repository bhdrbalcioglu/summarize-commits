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
    if (!Array.isArray(branches.value)) {
      console.warn('🔍 [COMMIT STORE] branches.value is not an array:', typeof branches.value, branches.value)
      return null
    }
    return branches.value.find(branch => branch.name === selectedBranchName.value) || null
  })

  const defaultBranch = computed(() => {
    if (!Array.isArray(branches.value)) {
      console.warn('🔍 [COMMIT STORE] branches.value is not an array:', typeof branches.value, branches.value)
      return null
    }
    return branches.value.find(branch => branch.is_default) || branches.value[0] || null
  })

  const isLoadingBranches = computed(() => statusBranches.value === 'loading')
  const isLoadingCommits = computed(() => statusCommits.value === 'loading')

  // Helper function to get project identifier for API calls
  const getProjectIdentifier = (project: any): string => {
    const authStore = useAuthStore()
    
    // Handle case where project is an API response wrapper with { status: "success", data: {...} }
    let actualProject = project
    if (project?.status === 'success' && project?.data) {
      console.log('🔍 [COMMIT STORE] Detected API response wrapper, extracting data')
      actualProject = project.data
    }
    
    console.log('🔍 [COMMIT STORE] getProjectIdentifier called with project:', {
      provider: authStore.currentProvider,
      projectKeys: Object.keys(actualProject || {}),
      projectType: typeof actualProject,
      isProxy: actualProject?.constructor?.name,
      // Log actual values
      path_with_namespace: actualProject?.path_with_namespace,
      namespace: actualProject?.namespace,
      namespaceName: actualProject?.namespace?.name,
      name: actualProject?.name,
      id: actualProject?.id,
      // Only log full project in debug mode to avoid clutter
      wasWrapped: project !== actualProject
    })
    
    if (authStore.currentProvider === 'github') {
      // First try path_with_namespace (most reliable)
      if (actualProject?.path_with_namespace) {
        console.log('🔍 [COMMIT STORE] Using path_with_namespace:', actualProject.path_with_namespace)
        return actualProject.path_with_namespace
      }
      
      // Fallback: construct from namespace and name
      if (actualProject?.namespace?.name && actualProject?.name) {
        const identifier = `${actualProject.namespace.name}/${actualProject.name}`
        console.log('🔍 [COMMIT STORE] Constructed from namespace/name:', identifier)
        return identifier
      }
      
      // Last resort: check if name contains the full path (owner/repo)
      if (actualProject?.name && actualProject.name.includes('/')) {
        console.log('🔍 [COMMIT STORE] Using name as full path:', actualProject.name)
        return actualProject.name
      }
      
      // Additional fallback: check if any field contains what looks like owner/repo format
      const possibleFields = [
        actualProject?.full_name,
        actualProject?.path_with_namespace, 
        actualProject?.name,
        actualProject?.id
      ].filter(Boolean)
      
      for (const field of possibleFields) {
        const fieldStr = String(field)
        if (fieldStr && fieldStr.includes('/') && fieldStr.split('/').length === 2) {
          console.log('🔍 [COMMIT STORE] Found owner/repo format in field:', fieldStr)
          return fieldStr
        }
      }
      
      console.error('🔴 [COMMIT STORE] Cannot construct GitHub project identifier from project:')
      console.error('🔴 [COMMIT STORE] Project details:', JSON.stringify(actualProject, null, 2))
      throw new Error(`Cannot construct GitHub project identifier. Missing required fields: path_with_namespace, or namespace.name + name. Available fields: ${Object.keys(actualProject || {}).join(', ')}`)
    }
    
    const identifier = String(actualProject?.id)
    console.log('🔍 [COMMIT STORE] Non-GitHub identifier:', identifier)
    return identifier
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
      console.log('🔴 [COMMIT STORE] fetchBranchesForProject: Missing auth or project context')
      console.log('🔴 [COMMIT STORE] Auth state:', { 
        isAuthenticated: authStore.isUserAuthenticated, 
        provider: authStore.currentProvider 
      })
      console.log('🔴 [COMMIT STORE] Project state:', { 
        hasProject: !!projectStore.currentProject,
        projectStatus: projectStore.status
      })
      return
    }

    try {
      statusBranches.value = 'loading'
      errorMsgBranches.value = null

      const projectId = getProjectIdentifier(projectStore.currentProject)
      
      // Additional validation: make sure we have a valid project identifier
      if (!projectId || projectId.includes('undefined') || projectId === 'undefined') {
        throw new Error(`Invalid project identifier: "${projectId}". Project data may be incomplete.`)
      }

      console.log('🔍 [COMMIT STORE] fetchBranchesForProject: Using project identifier:', projectId)

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
      console.error('❌ [COMMIT STORE] fetchBranchesForProject error:', error)
      
      const projectId = projectStore.currentProject ? getProjectIdentifier(projectStore.currentProject) : 'unknown'
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

  const prepareCommitBundlesForAI = async (): Promise<BackendCommitBundleItem[]> => {
    console.log('📦 [commitStore] Starting prepareCommitBundlesForAI')
    
    const authStore = useAuthStore()
    const projectStore = useProjectStore()

    if (!authStore.isUserAuthenticated || !projectStore.currentProject) {
      console.log('❌ [commitStore] Authentication or project check failed')
      console.log('🔐 [commitStore] User authenticated:', authStore.isUserAuthenticated)
      console.log('📁 [commitStore] Current project:', projectStore.currentProject?.name)
      throw new Error('User not authenticated or no project selected')
    }

    if (selectedCommitIdsForAI.value.length === 0) {
      console.log('❌ [commitStore] No commits selected for AI analysis')
      throw new Error('No commits selected for AI analysis')
    }

    console.log('📊 [commitStore] Selected commit IDs:', selectedCommitIdsForAI.value)

    try {
      statusCommitBundles.value = 'loading'
      errorMsgCommitBundles.value = null

      const projectId = getProjectIdentifier(projectStore.currentProject)
      console.log('🆔 [commitStore] Project identifier:', projectId)
      
      const commitBundles: BackendCommitBundleItem[] = []

      console.log('🔄 [commitStore] Fetching detailed commit data for', selectedCommitIdsForAI.value.length, 'commits')
      
      // Fetch detailed commit data for each selected commit
      for (const commitId of selectedCommitIdsForAI.value) {
        try {
          console.log('📥 [commitStore] Fetching details for commit:', commitId)
          const commitDetail = await commitService.fetchCommitDetail(projectId, commitId)
          console.log('✅ [commitStore] Commit detail received:', {
            id: commitDetail.id,
            author: commitDetail.author.name,
            filesCount: commitDetail.files_changed.length,
            messagePreview: commitDetail.message.substring(0, 50) + '...'
          })
          
          // Convert to BackendCommitBundleItem format
          const bundle: BackendCommitBundleItem = {
            provider: commitDetail.provider,
            commit_id: commitDetail.id,
            author_name: commitDetail.author.name,
            message: commitDetail.message,
            files_changed: commitDetail.files_changed.map((file: any) => ({
              file_path: file.new_path,
              diff: file.diff
            }))
          }
          
          console.log('🔄 [commitStore] Converted bundle:', {
            commit_id: bundle.commit_id,
            author_name: bundle.author_name,
            files_count: bundle.files_changed.length,
            total_diff_size: bundle.files_changed.reduce((sum, f) => sum + f.diff.length, 0)
          })
          
          commitBundles.push(bundle)
        } catch (error) {
          console.error(`💥 [commitStore] Failed to fetch details for commit ${commitId}:`, error)
          // Continue with other commits rather than failing completely
        }
      }

      if (commitBundles.length === 0) {
        console.log('❌ [commitStore] No commit bundles were successfully prepared')
        throw new Error('Failed to prepare any commit data for AI analysis')
      }

      console.log('✅ [commitStore] Successfully prepared', commitBundles.length, 'commit bundles')
      console.log('📊 [commitStore] Total diff size:', commitBundles.reduce((sum, bundle) => 
        sum + bundle.files_changed.reduce((fileSum, file) => fileSum + file.diff.length, 0), 0
      ), 'characters')

      statusCommitBundles.value = 'ready'
      return commitBundles

    } catch (error: any) {
      console.error('💥 [commitStore] Error in prepareCommitBundlesForAI:', error)
      statusCommitBundles.value = 'error'
      errorMsgCommitBundles.value = error.message || 'Failed to prepare commit bundles for AI'
      throw error
    }
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
    prepareCommitBundlesForAI,
    resetCommitState,
    resetBranchState,
    resetAllState,
    $reset
  }
})
