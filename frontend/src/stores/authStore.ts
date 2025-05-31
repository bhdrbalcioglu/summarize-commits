// frontend/src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../stores/userStore'
import apiService from '../services/apiService'

// Types
export type AuthProvider = 'github' | 'gitlab'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const authProvider = ref<AuthProvider | null>(null)
  const _hasTriedFetchingUser = ref(false)

  // Computed getters
  const hasUser = computed(() => !!user.value)
  const isUserAuthenticated = computed(() => !!user.value)
  const currentProvider = computed(() => authProvider.value)
  const userId = computed(() => (user.value?.id ? String(user.value.id) : null))
  const userName = computed(() => user.value?.name || null)
  const userEmail = computed(() => user.value?.email || null)

  // Actions
  const login = async (provider: 'github' | 'gitlab' = 'github') => {
    console.log(`🔐 [AUTH STORE] Initiating login with provider: ${provider}`)
    console.log('🔗 [AUTH STORE] Using frontend Supabase OAuth flow')
    console.log(`🔗 [AUTH STORE] Provider: ${provider}`)

    try {
      const { supabase } = await import('@/lib/supabaseClient')

      // Define scopes based on provider to match backend configuration
      const scopes =
        provider === 'github'
          ? 'user:email repo' // Match backend GitHub scopes for repository access
          : 'read_user read_api read_repository' // Match backend GitLab scopes

      console.log(`🔑 [AUTH STORE] Requesting OAuth scopes: ${scopes}`)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: scopes,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        console.error('❌ [AUTH STORE] Supabase OAuth error:', error)
        throw error
      }

      console.log(`🔗 [AUTH STORE] OAuth initiated successfully`)
    } catch (error) {
      console.error('❌ [AUTH STORE] Login failed:', error)
      throw error
    }
  }

  const fetchCurrentUser = async () => {
    console.log('👤 [AUTH STORE] Starting fetchCurrentUser...')
    console.log(`👤 [AUTH STORE] Current state: isLoading=${isLoading.value}, hasUser=${hasUser.value}`)

    _hasTriedFetchingUser.value = true // Mark that we've attempted to fetch

    try {
      isLoading.value = true

      console.log('🍪 [AUTH STORE] Attempting cookie-based authentication...')
      console.log(`            
            
           `)

      // Use backend /me endpoint with credentials (cookies)
      const response = await apiService.get('/auth/me')

      if (response.data?.user) {
        console.log('✅ [AUTH STORE] User authenticated via backend:', response.data.user.email)
        user.value = response.data.user
        isAuthenticated.value = true
        authProvider.value = response.data.user.provider as AuthProvider
        return response.data.user
      } else {
        console.log('⚠️ [AUTH STORE] No user data in response')
        user.value = null
        isAuthenticated.value = false
        authProvider.value = null
        return null
      }
    } catch (error: any) {
      console.error('❌ [AUTH STORE] Authentication failed:', error)

      // Clear auth state on error
      user.value = null
      isAuthenticated.value = false
      authProvider.value = null

      if (error.response?.status === 401) {
        console.log('🔓 [AUTH STORE] User not authenticated (401)')
      } else {
        console.error('💥 [AUTH STORE] Unexpected error during auth check:', error.message)
      }

      throw error
    } finally {
      isLoading.value = false
      console.log(`👤 [AUTH STORE] fetchCurrentUser completed. Authenticated: ${isAuthenticated.value}`)
    }
  }

  const logout = async () => {
    console.log('🚪 [AUTH STORE] Starting logout...')

    try {
      // Call backend logout endpoint
      await apiService.post('/auth/logout')
      console.log('✅ [AUTH STORE] Backend logout successful')
    } catch (error) {
      console.warn('⚠️ [AUTH STORE] Backend logout failed, continuing with local logout:', error)
    }

    // Clear local state
    user.value = null
    isAuthenticated.value = false
    authProvider.value = null

    console.log('🔓 [AUTH STORE] Local state cleared')

    // Redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const handleCallback = async (searchParams: URLSearchParams) => {
    console.log('🔗 [AUTH CALLBACK] Processing callback with search params')

    try {
      // Extract any error from URL
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        console.error('❌ [AUTH CALLBACK] OAuth error:', error, errorDescription)
        throw new Error(`OAuth error: ${error} - ${errorDescription}`)
      }

      // Check if we have a success indicator
      const success = searchParams.get('success')
      if (success === 'true') {
        console.log('✅ [AUTH CALLBACK] OAuth success detected')

        // Fetch user data
        await fetchCurrentUser()

        console.log('✅ [AUTH CALLBACK] Callback processing completed successfully')
        return true
      } else {
        console.warn('⚠️ [AUTH CALLBACK] No success indicator in callback')
        return false
      }
    } catch (error) {
      console.error('❌ [AUTH CALLBACK] Callback processing failed:', error)
      throw error
    }
  }

  // Initialize auth state
  const initializeAuth = async () => {
    console.log('🚀 [AUTH STORE] Initializing authentication state...')

    try {
      await fetchCurrentUser()
    } catch (error) {
      console.log('ℹ️ [AUTH STORE] No existing session found during initialization')
    }
  }

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    authProvider,
    _hasTriedFetchingUser,

    // Getters
    hasUser,
    isUserAuthenticated,
    currentProvider,
    userId,
    userName,
    userEmail,

    // Actions
    login,
    logout,
    fetchCurrentUser,
    handleCallback,
    initializeAuth
  }
})
