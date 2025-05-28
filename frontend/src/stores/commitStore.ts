// frontend/src/stores/commitStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useProjectStore } from './projectStore'
import apiClient from '@/services/apiService'
// Assuming types align with backend definitions (backend/src/types/git.types.ts)
import type { Branch, Commit, BackendCommitBundleItem, CommitDetail } from '@/types/commit' // Adjust path if necessary

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

export const useCommitStore = defineStore('commit', {
  state: (): CommitState => ({
    branches: [],
    selectedBranchName: null,
    commits: [],
    selectedCommitIdsForAI: [],
    // commitBundlesForAI: [], // AI analysis results will be in aiResponseStore

    statusBranches: 'idle' as CommitStatus,
    statusCommits: 'idle' as CommitStatus,
    statusCommitBundles: 'idle' as CommitStatus,

    currentPage: 1,
    perPage: 20,
    totalCommits: 0,
    isMoreCommits: true,
    sinceDate: null,
    untilDate: null,

    errorMsgBranches: null,
    errorMsgCommits: null,
    errorMsgCommitBundles: null
  }),
  getters: {
    activeBranch: (state): Branch | null => {
      if (!state.selectedBranchName) return null
      return state.branches.find((b) => b.name === state.selectedBranchName) || null
    },
    // Backward compatibility getters
    isLoadingBranches: (state): boolean => state.statusBranches === 'loading',
    isLoadingCommits: (state): boolean => state.statusCommits === 'loading',
    isLoadingCommitBundles: (state): boolean => state.statusCommitBundles === 'loading',
    errorBranches: (state): string | null => state.errorMsgBranches,
    errorCommits: (state): string | null => state.errorMsgCommits,
    errorCommitBundles: (state): string | null => state.errorMsgCommitBundles
  },
  actions: {
    // --- BRANCH MANAGEMENT ---
    async fetchBranchesForProject() {
      const projectStore = useProjectStore()
      const authStore = useAuthStore()

      if (!authStore.isUserAuthenticated || !projectStore.activeProject?.id || !authStore.currentProvider) {
        this.errorMsgBranches = 'Authentication or Project ID missing for fetching branches.'
        this.branches = []
        this.statusBranches = 'error'
        return
      }
      
      this.statusBranches = 'loading'
      this.errorMsgBranches = null
      
      try {
        const provider = authStore.currentProvider
        const projectIdentifier = projectStore.activeProject.id // For GitLab
        const projectPath = projectStore.activeProject.path_with_namespace // For GitHub "owner/repo"

        let endpoint = ''
        if (provider === 'gitlab') {
          endpoint = `/gitlab/projects/${projectIdentifier}/branches`
        } else if (provider === 'github') {
          endpoint = `/github/repos/${projectPath}/branches`
        } else {
          throw new Error('Unsupported provider for fetching branches.')
        }

        const response = await apiClient.get<Branch[]>(endpoint)
        this.branches = response.data
        this.statusBranches = 'ready'

        const currentSelectedBranchExists = this.selectedBranchName && this.branches.some((b) => b.name === this.selectedBranchName)
        if (!currentSelectedBranchExists && this.branches.length > 0) {
          const defaultBranch = this.branches.find((b) => b.is_default) || this.branches[0]
          this.selectBranch(defaultBranch.name)
        } else if (this.branches.length === 0) {
          this.selectBranch(null) // No branches found
        } else if (currentSelectedBranchExists && this.selectedBranchName) {
          // If current branch still exists, trigger fetch commits for it if list is empty
          if (this.commits.length === 0) {
            this.fetchCommitsForCurrentBranch()
          }
        }
      } catch (err: any) {
        this.errorMsgBranches = err.response?.data?.message || err.message || 'Failed to fetch branches.'
        this.branches = []
        this.statusBranches = 'error'
      }
    },

    selectBranch(branchName: string | null) {
      if (this.selectedBranchName === branchName) return

      this.selectedBranchName = branchName
      this.commits = []
      this.currentPage = 1
      this.isMoreCommits = true
      this.totalCommits = 0
      this.selectedCommitIdsForAI = []
      // this.commitBundlesForAI = []; // AI results handled by aiResponseStore
      this.statusCommits = 'idle'

      if (branchName) {
        this.fetchCommitsForCurrentBranch()
      }
    },

    // --- COMMIT LIST MANAGEMENT ---
    setCommitFilters(filters: { since?: string | null; until?: string | null; perPage?: number }) {
      let needsRefresh = false
      if (filters.since !== undefined && this.sinceDate !== filters.since) {
        this.sinceDate = filters.since
        needsRefresh = true
      }
      if (filters.until !== undefined && this.untilDate !== filters.until) {
        this.untilDate = filters.until
        needsRefresh = true
      }
      if (filters.perPage !== undefined && this.perPage !== filters.perPage) {
        this.perPage = filters.perPage
        needsRefresh = true
      }

      if (needsRefresh) {
        this.currentPage = 1
        this.commits = []
        this.isMoreCommits = true
        this.statusCommits = 'idle'
        this.fetchCommitsForCurrentBranch()
      }
    },

    async fetchCommitsForCurrentBranch(loadMore: boolean = false) {
      const projectStore = useProjectStore()
      const authStore = useAuthStore()

      if (!authStore.isUserAuthenticated || !projectStore.activeProject?.id || !this.selectedBranchName || !authStore.currentProvider) {
        this.errorMsgCommits = 'Cannot fetch commits: Missing auth, project, branch, or provider.'
        if (!loadMore) this.commits = [] // Clear if it's a fresh load attempt
        this.statusCommits = 'error'
        return
      }
      if (this.statusCommits === 'loading') return

      this.statusCommits = 'loading'
      this.errorMsgCommits = null

      if (!loadMore) {
        this.currentPage = 1
        this.commits = []
        this.isMoreCommits = true
      }

      const params: FetchCommitsParams = {
        branch: this.selectedBranchName,
        page: this.currentPage,
        perPage: this.perPage,
        since: this.sinceDate,
        until: this.untilDate
      }

      try {
        const provider = authStore.currentProvider
        const projectIdentifier = projectStore.activeProject.id // For GitLab
        const projectPath = projectStore.activeProject.path_with_namespace // For GitHub "owner/repo"

        let endpoint = ''
        if (provider === 'gitlab') {
          endpoint = `/gitlab/projects/${projectIdentifier}/commits`
        } else if (provider === 'github') {
          endpoint = `/github/repos/${projectPath}/commits`
        } else {
          throw new Error('Unsupported provider for fetching commits.')
        }

        const response = await apiClient.get<BackendCommitListResponse>(endpoint, { params })
        const newCommits = response.data.commits || []

        this.commits = loadMore ? [...this.commits, ...newCommits] : newCommits
        if (response.data.totalCommits !== undefined && !loadMore) {
          this.totalCommits = response.data.totalCommits
        }
        this.isMoreCommits = response.data.isMore !== undefined ? response.data.isMore : newCommits.length === this.perPage
        if (response.data.currentPage !== undefined) {
          this.currentPage = response.data.currentPage
        }
        this.statusCommits = 'ready'
      } catch (err: any) {
        this.errorMsgCommits = err.response?.data?.message || err.message || 'Failed to fetch commits.'
        this.statusCommits = 'error'
      }
    },

    loadMoreCommits() {
      if (this.isMoreCommits && this.statusCommits !== 'loading') {
        this.currentPage++
        this.fetchCommitsForCurrentBranch(true)
      }
    },

    // --- AI RELATED COMMIT DATA PREPARATION ---
    toggleCommitSelectionForAI(commitId: string) {
      const index = this.selectedCommitIdsForAI.indexOf(commitId)
      if (index > -1) {
        this.selectedCommitIdsForAI.splice(index, 1)
      } else {
        this.selectedCommitIdsForAI.push(commitId)
      }
    },

    async prepareCommitBundlesForAI(): Promise<BackendCommitBundleItem[]> {
      const projectStore = useProjectStore()
      const authStore = useAuthStore()

      if (!authStore.isUserAuthenticated || !projectStore.activeProject?.id || this.selectedCommitIdsForAI.length === 0 || !authStore.currentProvider) {
        this.errorMsgCommitBundles = 'Missing data for preparing commit bundles.'
        this.statusCommitBundles = 'error'
        throw new Error(this.errorMsgCommitBundles)
      }
      
      this.statusCommitBundles = 'loading'
      this.errorMsgCommitBundles = null
      
      try {
        const provider = authStore.currentProvider
        const projectIdentifier = projectStore.activeProject.id // GitLab ID
        const projectPath = projectStore.activeProject.path_with_namespace // GitHub "owner/repo"

        let endpoint = ''
        if (provider === 'gitlab') {
          endpoint = `/gitlab/projects/${projectIdentifier}/commits-bundle`
        } else if (provider === 'github') {
          endpoint = `/github/repos/${projectPath}/commits-bundle`
        } else {
          throw new Error('Unsupported provider for preparing commit bundles.')
        }

        // The request body to the backend expects { commitIds: string[] }
        const response = await apiClient.post<BackendCommitBundleItem[]>(endpoint, { commitIds: this.selectedCommitIdsForAI })
        // This action returns the bundles; aiResponseStore will call this and then send to AI backend.
        this.statusCommitBundles = 'ready'
        return response.data
      } catch (err: any) {
        this.errorMsgCommitBundles = err.response?.data?.message || err.message || 'Failed to prepare commit bundles.'
        this.statusCommitBundles = 'error'
        throw err
      }
    },

    clearSelectedCommitIdsForAI() {
      this.selectedCommitIdsForAI = []
    },

    resetCommitState() {
      this.branches = []
      this.selectedBranchName = null
      this.commits = []
      this.selectedCommitIdsForAI = []
      this.statusBranches = 'idle'
      this.statusCommits = 'idle'
      this.statusCommitBundles = 'idle'
      this.currentPage = 1
      this.perPage = 20
      this.totalCommits = 0
      this.isMoreCommits = true
      this.sinceDate = null
      this.untilDate = null
      this.errorMsgBranches = null
      this.errorMsgCommits = null
      this.errorMsgCommitBundles = null
    },

    $reset() {
      this.resetCommitState()
    }
  }
})
