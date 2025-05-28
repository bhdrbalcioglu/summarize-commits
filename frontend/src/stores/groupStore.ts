// frontend/src/stores/groupStore.ts
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import apiClient from '@/services/apiService'
import type { Group } from '@/types/group'
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage'

export interface GroupState {
  groups: Group[]
  selectedGroupId: string | null
  isLoading: boolean
  error: string | null
}

export const useGroupStore = defineStore('group', {
  state: (): GroupState => ({
    groups: [],
    selectedGroupId: getStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID, null),
    isLoading: false,
    error: null
  }),
  getters: {
    selectedGroup: (state): Group | null => {
      return state.groups.find((group) => group.id === state.selectedGroupId) || null
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
          setStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID, newSelectedId)
        } else {
          removeStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID)
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
      removeStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID)
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
      removeStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID)
    }
  }
})
