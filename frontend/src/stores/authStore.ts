// frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/apiService'
import type { User } from './userStore'
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage'

export type AuthProvider = 'github' | 'gitlab'

export interface AuthState {
  user: User | null
  isLoading: boolean
  authProvider: AuthProvider | null
}

// Helper to safely get stored user
function getStoredUser(): User | null {
  return getStorageValue<User | null>(GLOBAL_KEYS.AUTH_USER, null)
}

// Helper to safely get stored provider
function getStoredProvider(): AuthProvider | null {
  return getStorageValue<AuthProvider | null>(GLOBAL_KEYS.AUTH_PROVIDER, null)
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: getStoredUser(), // Initialize from localStorage for quick UI rehydration
    isLoading: false,
    authProvider: getStoredProvider() // Initialize from localStorage
  }),
  getters: {
    isUserAuthenticated: (state): boolean => !!state.user,
    currentProvider: (state): AuthProvider | null => state.authProvider,
    userId: (state): string | null => (state.user?.id ? String(state.user.id) : null),
    userName: (state): string | null => state.user?.name || null,
    userEmail: (state): string | null => state.user?.email || null
  },
  actions: {
    setUser(userData: User) {
      this.user = userData
      this.authProvider = userData.provider as AuthProvider
      // Persist to localStorage for session continuity
      setStorageValue(GLOBAL_KEYS.AUTH_USER, userData)
      setStorageValue(GLOBAL_KEYS.AUTH_PROVIDER, userData.provider)
    },

    clearUser() {
      this.user = null
      this.authProvider = null
      removeStorageValue(GLOBAL_KEYS.AUTH_USER)
      removeStorageValue(GLOBAL_KEYS.AUTH_PROVIDER)
    },

    async fetchCurrentUser(): Promise<boolean> {
      this.isLoading = true
      try {
        const response = await apiClient.get<User>('/auth/me')
        this.setUser(response.data)
        return true
      } catch (error: any) {
        console.error('Failed to fetch current user:', error)
        this.clearUser()
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout(): Promise<void> {
      this.isLoading = true
      try {
        await apiClient.post('/auth/logout')
      } catch (error) {
        console.error('Logout request failed:', error)
      } finally {
        this.clearUser()
        this.isLoading = false
        // Redirect to home page
        window.location.href = '/'
      }
    },

    async initializeAuth(): Promise<void> {
      // If user data is already in localStorage from a previous session,
      // we still need to verify it's valid by calling fetchCurrentUser
      if (this.user) {
        // User data exists in state (loaded from localStorage), verify it's still valid
        const isValid = await this.fetchCurrentUser()
        if (!isValid) {
          // If verification fails, clear the invalid data
          this.clearUser()
        }
      } else {
        // No user data in state, try to fetch from server (in case of fresh login)
        await this.fetchCurrentUser()
      }
    }
  }
})
