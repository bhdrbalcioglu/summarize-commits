// frontend/src/stores/commitStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useProjectStore } from './projectStore'
import apiClient from '@/services/apiService'
// Assuming types align with backend definitions (backend/src/types/git.types.ts)
import type { Branch, Commit, BackendCommitBundleItem, CommitDetail } from '@/types/commit' // Adjust path if necessary

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

  isLoadingBranches: boolean
  isLoadingCommits: boolean
  isLoadingCommitBundles: boolean // For preparing bundles TO SEND to AI

  currentPage: number
  perPage: number
  totalCommits: number // From backend if available
  isMoreCommits: boolean
  sinceDate: string | null
  untilDate: string | null

  errorBranches: string | null
  errorCommits: string | null
  errorCommitBundles: string | null
}

export const useCommitStore = defineStore('commit', {
  state: (): CommitState => ({
    branches: [],
    selectedBranchName: null,
    commits: [],
    selectedCommitIdsForAI: [],
    // commitBundlesForAI: [], // AI analysis results will be in aiResponseStore

    isLoadingBranches: false,
    isLoadingCommits: false,
    isLoadingCommitBundles: false,

    currentPage: 1,
    perPage: 20,
    totalCommits: 0,
    isMoreCommits: true,
    sinceDate: null,
    untilDate: null,

    errorBranches: null,
    errorCommits: null,
    errorCommitBundles: null
  }),
  getters: {
    activeBranch: (state): Branch | null => {
      if (!state.selectedBranchName) return null
      return state.branches.find((b) => b.name === state.selectedBranchName) || null
    }
  },
  actions: {
    // --- BRANCH MANAGEMENT ---
    async fetchBranchesForProject() {
      const projectStore = useProjectStore()
      const authStore = useAuthStore()

      if (!authStore.isUserAuthenticated || !projectStore.activeProject?.id || !authStore.currentProvider) {
        this.errorBranches = 'Authentication or Project ID missing for fetching branches.'
        this.branches = []
        return
      }
      this.isLoadingBranches = true
      this.errorBranches = null
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
        this.errorBranches = err.response?.data?.message || err.message || 'Failed to fetch branches.'
        this.branches = []
      } finally {
        this.isLoadingBranches = false
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
        this.fetchCommitsForCurrentBranch()
      }
    },

    async fetchCommitsForCurrentBranch(loadMore: boolean = false) {
      const projectStore = useProjectStore()
      const authStore = useAuthStore()

      if (!authStore.isUserAuthenticated || !projectStore.activeProject?.id || !this.selectedBranchName || !authStore.currentProvider) {
        this.errorCommits = 'Cannot fetch commits: Missing auth, project, branch, or provider.'
        if (!loadMore) this.commits = [] // Clear if it's a fresh load attempt
        return
      }
      if (this.isLoadingCommits) return

      this.isLoadingCommits = true
      this.errorCommits = null

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
      } catch (err: any) {
        this.errorCommits = err.response?.data?.message || err.message || 'Failed to fetch commits.'
      } finally {
        this.isLoadingCommits = false
      }
    },

    loadMoreCommits() {
      if (this.isMoreCommits && !this.isLoadingCommits) {
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
        this.errorCommitBundles = 'Missing data for preparing commit bundles.'
        throw new Error(this.errorCommitBundles)
      }
      this.isLoadingCommitBundles = true
      this.errorCommitBundles = null
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
        return response.data
      } catch (err: any) {
        this.errorCommitBundles = err.response?.data?.message || err.message || 'Failed to prepare commit bundles.'
        throw err
      } finally {
        this.isLoadingCommitBundles = false
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
      this.isLoadingBranches = false
      this.isLoadingCommits = false
      this.isLoadingCommitBundles = false
      this.currentPage = 1
      this.perPage = 20
      this.totalCommits = 0
      this.isMoreCommits = true
      this.sinceDate = null
      this.untilDate = null
      this.errorBranches = null
      this.errorCommits = null
      this.errorCommitBundles = null
    }
  }
})
