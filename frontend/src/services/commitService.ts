import apiClient from './apiService'
import type { Branch, Commit, CommitDetail } from '@/types/commit'
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

  async fetchCommitDetail(projectId: string | number, commitSha: string): Promise<CommitDetail> {
    console.log('🔍 [commitService] fetchCommitDetail called')
    console.log('🆔 [commitService] Project ID:', projectId)
    console.log('📝 [commitService] Commit SHA:', commitSha)
    
    const authStore = useAuthStore()
    const provider = authStore.currentProvider

    if (!provider) {
      console.log('❌ [commitService] No provider available')
      throw new Error('No provider available')
    }

    console.log('🔗 [commitService] Provider:', provider)

    let endpoint = ''
    if (provider === 'gitlab') {
      endpoint = `/gitlab/projects/${projectId}/commits/${commitSha}/details`
    } else if (provider === 'github') {
      // For GitHub, projectId should be in format "owner/repo"
      endpoint = `/github/repos/${projectId}/commits/${commitSha}`
    } else {
      console.log('❌ [commitService] Unsupported provider:', provider)
      throw new Error(`Unsupported provider: ${provider}`)
    }

    console.log('🌐 [commitService] API endpoint:', endpoint)
    console.log('📤 [commitService] Making API request...')

    try {
      const response = await apiClient.get<CommitDetail>(endpoint)
      console.log('✅ [commitService] API response received')
      console.log('📊 [commitService] Response data keys:', Object.keys(response.data))
      console.log('📁 [commitService] Files changed count:', response.data.files_changed?.length)
      console.log('👤 [commitService] Author:', response.data.author?.name)
      
      return response.data
    } catch (error) {
      console.error('💥 [commitService] Error fetching commit detail:', error)
      throw error
    }
  }
}

export const commitService = new CommitService() 