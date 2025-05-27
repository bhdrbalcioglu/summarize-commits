// frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/apiService' // Your configured axios instance
import router from '@/router' // Your Vue router instance, for navigation if needed within actions
import { useUserStore } from './userStore' // Import userStore
// This User type should ideally be consistent with what your backend's /api/auth/me returns.
// It should include all necessary fields for the frontend's display and logic.
// Based on backend/src/types/git.types.ts -> User
export interface AuthUser {
  id: string | number
  provider: 'gitlab' | 'github'
  username: string
  name: string
  avatar_url: string
  web_url?: string
  email?: string | null
  // providerToken?: string; // Optional: if your backend's /auth/me returns the provider's access token
  // and you need it for some specific frontend calls (generally not recommended
  // if backend proxies all calls)
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  authProvider: 'gitlab' | 'github' | null // Derived from user or persisted for quick access
  isLoading: boolean
  error: string | null
}

// Helper to safely parse JSON from localStorage
const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem('authUser')
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as AuthUser
    } catch (e) {
      console.error('Error parsing stored user:', e)
      localStorage.removeItem('authUser') // Clear corrupted data
      return null
    }
  }
  return null
}

const getStoredProvider = (): 'gitlab' | 'github' | null => {
  const provider = localStorage.getItem('authProvider')
  if (provider === 'gitlab' || provider === 'github') {
    return provider
  }
  return null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: getStoredUser(), // Initialize from localStorage for quick UI rehydration
    isAuthenticated: false, // Will be true after successful /me call
    authProvider: getStoredProvider(), // Initialize from localStorage
    isLoading: false,
    error: null
  }),

  getters: {
    isUserAuthenticated: (state): boolean => state.isAuthenticated,
    currentUser: (state): AuthUser | null => state.user,
    currentProvider: (state): 'gitlab' | 'github' | null => state.authProvider,
    authenticationIsLoading: (state): boolean => state.isLoading,
    authenticationError: (state): string | null => state.error
  },

  actions: {
    // Internal helper to update authentication state consistently
    _updateAuthState(userData: AuthUser | null, errorMsg: string | null = null) {
      const userStore = useUserStore()

      if (userData) {
        console.log('[AUTH STORE] Updating state with user:', userData) // STATE GÜNCELLENİYOR MU?
        this.user = userData
        this.isAuthenticated = true
        this.authProvider = userData.provider
        this.error = null
        localStorage.setItem('authUser', JSON.stringify(userData))
        localStorage.setItem('authProvider', userData.provider)
        userStore.setCurrentUser(userData) // Sync userStore
      } else {
        console.log('[AUTH STORE] State after _updateAuthState: user=', this.user, 'isAuthenticated=', this.isAuthenticated) // YENİ LOG
        this.user = null
        this.isAuthenticated = false
        this.authProvider = null
        this.error = errorMsg // Set error only if userData is null and errorMsg is provided
        localStorage.removeItem('authUser')
        localStorage.removeItem('authProvider')
        userStore.setCurrentUser(null) // Sync userStore
        // localStorage.removeItem('userId'); // Clean up old keys if any
      }
    },

    async loginWithProvider(provider: 'gitlab' | 'github') {
      if (this.isLoading) return
      this.isLoading = true
      this.error = null
      try {
        // Construct the backend login URL.
        // apiClient.defaults.baseURL should be like 'http://localhost:3001/api'
        // So, the full URL will be 'http://localhost:3001/api/auth/login/gitlab'
        const loginUrl = `${apiClient.defaults.baseURL}/auth/login/${provider}`
        window.location.href = loginUrl
        // The browser will navigate away. isLoading will be reset when the app
        // re-initializes after redirect back from backend.
      } catch (err: any) {
        // This catch block might not be hit if window.location.href succeeds immediately.
        // Errors in redirection are typically network or server-side.
        const message = `Login with ${provider} failed to initiate. ${err.message || ''}`
        this._updateAuthState(null, message) // Update error state
        this.isLoading = false // Ensure loading is reset
        console.error(message, err)
        // Optionally rethrow or handle in UI: throw new Error(message);
      }
    },

    // Fetches the current user from the backend if a session cookie exists.
    // This is the primary way to confirm authentication status.
    async fetchCurrentUser() {
      if (this.isLoading) return;

      this.isLoading = true;
      try {
        // DÜZELTME: API'den gelen cevap doğrudan AuthUser olduğu için tipi <AuthUser> yapıyoruz.
        const response = await apiClient.get<AuthUser>('/auth/me'); 
        console.log('[AUTH STORE] /me response (raw data):', response.data);

        // DÜZELTME: response.data zaten kullanıcı objesi, bu yüzden .user demeye gerek yok.
        this._updateAuthState(response.data); 
      } catch (err: any) {
        let errorMessage = 'Failed to fetch current user or no active session.';
        if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.message) {
            errorMessage = err.message;
        }
        console.warn('[AUTH STORE] fetchCurrentUser error:', errorMessage, err);
        this._updateAuthState(null, errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      if (this.isLoading) return
      this.isLoading = true
      try {
        await apiClient.post('/auth/logout') // Backend clears the HttpOnly cookie
      } catch (err: any) {
        // Log the error, but still proceed with frontend logout.
        console.error('Backend logout request failed:', err.response?.data?.message || err.message)
      } finally {
        this._updateAuthState(null, 'Successfully logged out.') // Clear state and set a generic message if needed
        this.isLoading = false
        router.push('/login').catch((e) => console.warn('Router push to /login after logout failed', e)) // Navigate to login page
      }
    },

    // Action to call when the Vue application initializes.
    async initializeAuth() {
      // If user data is already in localStorage from a previous session,
      // this.user would be pre-filled by the state initializer.
      // However, we still need to call /auth/me to *validate* that session cookie
      // and get potentially updated user details.
      // No need to check this.isLoading or this.user here; always attempt to validate on init.
      await this.fetchCurrentUser()
    },

    // Helper to manually clear auth error if needed from UI
    clearAuthError() {
      this.error = null
    }
  }
})
