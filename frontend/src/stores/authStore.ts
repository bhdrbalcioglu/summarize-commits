// frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/apiService'
import type { User } from './userStore'
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage'
import { eventBus } from '@/utils/eventBus'

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
    async setUser(userData: User) {
      const wasAuthenticated = this.isUserAuthenticated
      const oldProvider = this.authProvider
      
      this.user = userData
      this.authProvider = userData.provider as AuthProvider
      
      // Persist to localStorage for session continuity
      setStorageValue(GLOBAL_KEYS.AUTH_USER, userData)
      setStorageValue(GLOBAL_KEYS.AUTH_PROVIDER, userData.provider)

      // Emit authentication status change event
      await eventBus.emit('AUTH_STATUS_CHANGED', {
        isAuthenticated: true,
        provider: userData.provider as AuthProvider
      })

      // If provider changed, emit additional events
      if (oldProvider && oldProvider !== userData.provider) {
        console.log(`Provider changed from ${oldProvider} to ${userData.provider}`)
      }
    },

    async clearUser() {
      const wasAuthenticated = this.isUserAuthenticated
      
      this.user = null
      this.authProvider = null
      removeStorageValue(GLOBAL_KEYS.AUTH_USER)
      removeStorageValue(GLOBAL_KEYS.AUTH_PROVIDER)

      // Emit events if user was previously authenticated
      if (wasAuthenticated) {
        await eventBus.emit('USER_LOGGED_OUT', undefined)
        await eventBus.emit('AUTH_STATUS_CHANGED', {
          isAuthenticated: false,
          provider: null
        })
      }
    },

    async loginWithProvider(provider: AuthProvider): Promise<void> {
      this.isLoading = true
      try {
        // Redirect to backend OAuth endpoint
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
        window.location.href = `${baseUrl}/api/auth/login/${provider}`
      } catch (error) {
        console.error(`Failed to initiate ${provider} login:`, error)
        this.isLoading = false
        throw error
      }
      // Note: isLoading will remain true until page redirects or user returns
    },

    async fetchCurrentUser(): Promise<boolean> {
      this.isLoading = true
      try {
        const response = await apiClient.get<User>('/auth/me')
        await this.setUser(response.data)
        return true
      } catch (error: any) {
        console.error('Failed to fetch current user:', error)
        await this.clearUser()
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
        await this.clearUser()
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
          await this.clearUser()
        }
      } else {
        // No user data in state, try to fetch from server (in case of fresh login)
        await this.fetchCurrentUser()
      }
    }
  }
})
