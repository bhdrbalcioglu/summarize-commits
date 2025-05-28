// frontend/src/stores/projectStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import apiClient from '@/services/apiService'
import type { Project } from '@/types/project' // Ensure this matches backend's Project type

export interface ProjectState {
  currentProject: Project | null
  isLoading: boolean
  error: string | null
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    currentProject: null,
    isLoading: false,
    error: null
  }),
  getters: {
    activeProject: (state): Project | null => state.currentProject,
    isLoadingProject: (state): boolean => state.isLoading,
    projectError: (state): string | null => state.error
  },
  actions: {
    setProject(project: Project | null) {
      this.currentProject = project
      this.isLoading = false
      this.error = null
    },

    async fetchProjectDetails(identifier: string | number) {
      const authStore = useAuthStore()
      
      if (!authStore.isUserAuthenticated || !authStore.currentProvider) {
        this.error = 'User not authenticated or provider not set.'
        this.currentProject = null
        return
      }
      if (!identifier) {
        this.error = 'Project identifier is required.'
        this.currentProject = null
        return
      }

      this.isLoading = true
      this.error = null
      // this.currentProject = null; // Optionally clear while fetching

      try {
        const provider = authStore.currentProvider
        let endpoint = ''

        if (provider === 'gitlab') {
          endpoint = `/gitlab/projects/${identifier}`
        } else if (provider === 'github') {
          // Assumes 'identifier' for GitHub is "owner/repoName"
          if (String(identifier).includes('/')) {
            endpoint = `/github/repos/${identifier}`
          } else {
            this.error = 'Invalid identifier for GitHub project. Expected "owner/repoName".'
            this.isLoading = false
            this.currentProject = null
            return
          }
        } else {
          this.error = 'Unsupported provider.'
          this.isLoading = false
          this.currentProject = null
          return
        }

        const response = await apiClient.get<Project>(endpoint)
        this.currentProject = response.data
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Failed to fetch project details.'
        this.currentProject = null
        console.error(`[ProjectStore] Error fetching project details for ${identifier}:`, err)
      } finally {
        this.isLoading = false
      }
    },

    clearProjectDetails() {
      this.currentProject = null
      this.isLoading = false
      this.error = null
    },

    resetProjectState() {
      this.currentProject = null
      this.isLoading = false
      this.error = null
    }
  }
})
