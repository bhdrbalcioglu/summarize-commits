import apiClient from './apiService'
import type { Branch, Commit } from '@/types/commit'
import { useAuthStore } from '@/stores/authStore'

export interface FetchCommitsResult {
  commits: Commit[]
  hasMore: boolean
  totalCommits?: number
  currentPage?: number
}

export interface CommitFilters {
  since?: string | null
  until?: string | null
  author?: string | null
}

class CommitService {
  async fetchBranches(projectId: string | number): Promise<Branch[]> {
    const authStore = useAuthStore()
    const provider = authStore.currentProvider

    if (!provider) {
      throw new Error('No provider available')
    }

    let endpoint = ''
    if (provider === 'gitlab') {
      endpoint = `/gitlab/projects/${projectId}/branches`
    } else if (provider === 'github') {
      // For GitHub, we need the path_with_namespace, not the ID
      // This should be handled by the caller
      endpoint = `/github/repos/${projectId}/branches`
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const response = await apiClient.get<Branch[]>(endpoint)
    return response.data
  }

  async fetchCommits(
    projectId: string | number,
    branchName: string,
    page: number = 1,
    filters: CommitFilters = {}
  ): Promise<FetchCommitsResult> {
    const authStore = useAuthStore()
    const provider = authStore.currentProvider

    if (!provider) {
      throw new Error('No provider available')
    }

    const params = {
      branch: branchName,
      page,
      perPage: 20,
      ...filters
    }

    let endpoint = ''
    if (provider === 'gitlab') {
      endpoint = `/gitlab/projects/${projectId}/commits`
    } else if (provider === 'github') {
      // For GitHub, we need the path_with_namespace, not the ID
      endpoint = `/github/repos/${projectId}/commits`
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const response = await apiClient.get<{
      commits: Commit[]
      isMore?: boolean
      totalCommits?: number
      currentPage?: number
    }>(endpoint, { params })

    return {
      commits: response.data.commits || [],
      hasMore: response.data.isMore ?? false,
      totalCommits: response.data.totalCommits,
      currentPage: response.data.currentPage
    }
  }
}

export const commitService = new CommitService() 