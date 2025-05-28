// frontend/src/stores/projectStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import apiClient from '@/services/apiService'
import type { Project } from '@/types/project' // Ensure this matches backend's Project type

export type ProjectStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ProjectState {
  currentProject: Project | null
  status: ProjectStatus
  errorMsg: string | null
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    currentProject: null,
    status: 'idle' as ProjectStatus,
    errorMsg: null
  }),
  getters: {
    activeProject: (state): Project | null => state.currentProject,
    isLoading: (state): boolean => state.status === 'loading',
    isLoadingProject: (state): boolean => state.status === 'loading', // Keep for backward compatibility
    error: (state): string | null => state.errorMsg, // Keep for backward compatibility
    projectError: (state): string | null => state.errorMsg
  },
  actions: {
    setProject(project: Project | null) {
      this.currentProject = project
      this.status = project ? 'ready' : 'idle'
      this.errorMsg = null
    },

    async selectProject(identifier: string): Promise<boolean> {
      this.status = 'loading'
      this.errorMsg = null

      const authStore = useAuthStore()
      
      if (!authStore.isUserAuthenticated || !authStore.currentProvider) {
        this.errorMsg = 'User not authenticated or provider not set.'
        this.currentProject = null
        this.status = 'error'
        return false
      }
      if (!identifier) {
        this.errorMsg = 'Project identifier is required.'
        this.currentProject = null
        this.status = 'error'
        return false
      }

      try {
        const provider = authStore.currentProvider
        let endpoint = ''

        if (provider === 'gitlab') {
          endpoint = `/gitlab/projects/${identifier}`
        } else if (provider === 'github') {
          if (String(identifier).includes('/')) {
            endpoint = `/github/repos/${identifier}`
          } else {
            this.errorMsg = 'Invalid identifier for GitHub project. Expected "owner/repoName".'
            this.currentProject = null
            this.status = 'error'
            return false
          }
        } else {
          this.errorMsg = 'Unsupported provider.'
          this.currentProject = null
          this.status = 'error'
          return false
        }

        const response = await apiClient.get<Project>(endpoint)
        this.currentProject = response.data
        this.status = 'ready'
        return true
      } catch (err: any) {
        this.errorMsg = err.response?.data?.message || err.message || 'Failed to fetch project details.'
        this.currentProject = null
        this.status = 'error'
        console.error(`[ProjectStore] Error fetching project details for ${identifier}:`, err)
        return false
      }
    },

    async fetchProjectDetails(identifier: string | number) {
      // Keep this method for backward compatibility, but delegate to selectProject
      return await this.selectProject(String(identifier))
    },

    clearProjectDetails() {
      this.currentProject = null
      this.status = 'idle'
      this.errorMsg = null
    },

    resetProjectState() {
      this.currentProject = null
      this.status = 'idle'
      this.errorMsg = null
    },

    $reset() {
      this.currentProject = null
      this.status = 'idle'
      this.errorMsg = null
    }
  }
})
