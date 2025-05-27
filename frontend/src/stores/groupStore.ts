// frontend/src/stores/groupStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import apiClient from '@/services/apiService'
import { useProjectListStore } from './projectListStore' // For selectGroup action

// Ensure this Group type aligns with what your backend API returns
// (originating from backend/src/types/git.types.ts)
// It should include 'provider' and other relevant fields.
export interface Group {
  id: string | number
  provider: 'gitlab' | 'github'
  name: string
  path: string // For GitHub, this is the org login; for GitLab, it's the group path.
  description: string | null
  web_url: string
  avatar_url: string | null
}

export const useGroupStore = defineStore('group', {
  state: () => ({
    groups: [] as Group[],
    isLoading: false,
    error: null as string | null,
    selectedGroupId: localStorage.getItem('selectedGroupId') || (null as string | null)
  }),
  getters: {
    selectedGroup: (state): Group | null => {
      if (!state.selectedGroupId) return null
      // Ensure consistent ID comparison (string vs number)
      const group = state.groups.find((g) => String(g.id) === state.selectedGroupId)
      return group || null
    },
    allGroups: (state): Group[] => state.groups,
    isLoadingGroups: (state): boolean => state.isLoading,
    groupError: (state): string | null => state.error
  },
  actions: {
    async fetchGroups() {
      const authStore = useAuthStore()
      if (!authStore.isUserAuthenticated || !authStore.currentProvider) {
        this.error = 'User not authenticated or provider not set to fetch groups.'
        this.groups = [] // Clear groups if auth fails
        // It might be better to not set an error here if this is called proactively
        // and let UI decide based on isLoading and empty groups list.
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const provider = authStore.currentProvider
        let endpoint = ''

        if (provider === 'gitlab') {
          endpoint = '/gitlab/user/groups'
        } else if (provider === 'github') {
          endpoint = '/github/user/orgs' // GitHub calls them organizations
        } else {
          // Should not happen if authProvider is correctly typed and set
          this.error = 'Unsupported provider for fetching groups.'
          this.groups = []
          this.isLoading = false
          return
        }

        const response = await apiClient.get<Group[]>(endpoint)
        this.groups = response.data
      } catch (err: any) {
        const defaultMessage = `Failed to fetch groups for ${authStore.currentProvider}.`
        this.error = err.response?.data?.message || err.message || defaultMessage
        console.error(this.error, err)
        this.groups = []
      } finally {
        this.isLoading = false
      }
    },

    selectGroup(groupId: string | number | null) {
      const newSelectedId = groupId !== null ? String(groupId) : null

      // Only update and trigger side effects if the selection actually changes
      if (this.selectedGroupId !== newSelectedId) {
        this.selectedGroupId = newSelectedId
        if (newSelectedId) {
          localStorage.setItem('selectedGroupId', newSelectedId)
        } else {
          localStorage.removeItem('selectedGroupId')
        }

        // Trigger fetching projects for this newly selected group.
        // projectListStore will use its own state (including this new selectedGroupId)
        // and the current authProvider to fetch relevant projects.
        const projectListStore = useProjectListStore()
        projectListStore.setGroupIdCriteria(newSelectedId) // Update criteria
        projectListStore.fetchProjects() // And fetch
      }
    },

    clearGroupsAndSelection() {
      this.groups = []
      this.selectedGroupId = null // Also clear selectedGroupId state
      localStorage.removeItem('selectedGroupId')
      this.error = null
      this.isLoading = false

      // When groups are cleared, projects associated with any selected group should also be cleared.
      const projectListStore = useProjectListStore()
      projectListStore.clearProjectsAndCriteria() // Assuming projectListStore has such a method
    },

    // Action to be called on logout or when authProvider changes to ensure clean state.
    resetGroupState() {
      this.groups = []
      this.isLoading = false
      this.error = null
      this.selectedGroupId = null
      localStorage.removeItem('selectedGroupId')
    }
  }
})
