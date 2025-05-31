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

    const response = await apiClient.get<any>(endpoint)
    
    // Handle potential response wrapping from backend
    let branchesData = response.data
    if (branchesData && typeof branchesData === 'object' && 'status' in branchesData && 'data' in branchesData) {
      console.log(`[CommitService] Backend response is wrapped, extracting data from status: ${branchesData.status}`)
      branchesData = branchesData.data
    }
    
    // Ensure we have an array
    if (!Array.isArray(branchesData)) {
      console.error(`[CommitService] Expected branches array, got:`, typeof branchesData, branchesData)
      throw new Error('Invalid branches data received from backend')
    }
    
    return branchesData
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

    const response = await apiClient.get<any>(endpoint, { params })

    // Handle potential response wrapping from backend
    let commitsData = response.data
    if (commitsData && typeof commitsData === 'object' && 'status' in commitsData && 'data' in commitsData) {
      console.log(`[CommitService] Backend response is wrapped, extracting data from status: ${commitsData.status}`)
      commitsData = commitsData.data
    }

    return {
      commits: commitsData.commits || [],
      hasMore: commitsData.isMore ?? false,
      totalCommits: commitsData.totalCommits,
      currentPage: commitsData.currentPage
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
      const response = await apiClient.get<any>(endpoint)
      console.log('✅ [commitService] API response received')
      console.log('📊 [commitService] Response data keys:', Object.keys(response.data))
      
      // Handle potential response wrapping from backend
      let commitDetailData = response.data
      if (commitDetailData && typeof commitDetailData === 'object' && 'status' in commitDetailData && 'data' in commitDetailData) {
        console.log(`[CommitService] Backend response is wrapped, extracting data from status: ${commitDetailData.status}`)
        commitDetailData = commitDetailData.data
      }
      
      console.log('📁 [commitService] Files changed count:', commitDetailData.files_changed?.length)
      console.log('👤 [commitService] Author:', commitDetailData.author?.name)
      
      return commitDetailData
    } catch (error) {
      console.error('💥 [commitService] Error fetching commit detail:', error)
      throw error
    }
  }
}

export const commitService = new CommitService() 