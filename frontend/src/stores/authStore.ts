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
    
    // Check if user is already authenticated
    if (isUserAuthenticated.value) {
      console.log('✅ [AUTH STORE] User already authenticated, redirecting to user page')
      if (typeof window !== 'undefined') {
        window.location.href = '/user'
      }
      return
    }
    
    // Check for existing Supabase session before starting OAuth
    try {
      const { supabase } = await import('@/lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.user) {
        console.log('✅ [AUTH STORE] Found existing Supabase session, attempting to restore...')
        await initializeAuth()
        
        if (isUserAuthenticated.value) {
          console.log('✅ [AUTH STORE] Session restored successfully, redirecting to user page')
          if (typeof window !== 'undefined') {
            window.location.href = '/user'
          }
          return
        }
      }
    } catch (sessionError) {
      console.log('ℹ️ [AUTH STORE] No existing session found, proceeding with OAuth')
    }

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

      if (response.data && response.data.id) {
        console.log('✅ [AUTH STORE] User authenticated via backend:', response.data.email)
        user.value = response.data
        isAuthenticated.value = true
        authProvider.value = response.data.provider as AuthProvider
        return response.data
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
      // Sign out from Supabase first
      const { supabase } = await import('@/lib/supabaseClient')
      await supabase.auth.signOut()
      console.log('✅ [AUTH STORE] Supabase logout successful')
    } catch (error) {
      console.warn('⚠️ [AUTH STORE] Supabase logout failed:', error)
    }

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
      // First, check if we have a valid Supabase session
      const { supabase } = await import('@/lib/supabaseClient')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session && !error) {
        console.log('✅ [AUTH STORE] Found valid Supabase session, restoring authentication')
        console.log('🔄 [AUTH STORE] Session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
        
        // Try to sync with backend using existing session
        try {
          await fetchCurrentUser()
          console.log('✅ [AUTH STORE] Successfully synchronized with backend')
        } catch (backendError) {
          console.warn('⚠️ [AUTH STORE] Backend sync failed, trying session handoff...')
          
          // If backend sync fails, try to update backend with current tokens
          try {
            const response = await apiService.post('/auth/session', {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              provider_token: session.provider_token,
              provider_refresh_token: session.provider_refresh_token
            })
            
            if (response.data) {
              user.value = response.data
              isAuthenticated.value = true
              authProvider.value = response.data.provider as AuthProvider
              console.log('✅ [AUTH STORE] Session handoff successful, user restored')
            }
          } catch (handoffError) {
            console.error('❌ [AUTH STORE] Session handoff failed, falling back to standard flow')
            throw handoffError
          }
        }
      } else {
        console.log('ℹ️ [AUTH STORE] No Supabase session found, trying backend cookies...')
        await fetchCurrentUser()
      }
    } catch (error) {
      console.log('ℹ️ [AUTH STORE] No existing session found during initialization')
    }
  }

  // Set up automatic session monitoring
  const setupSessionMonitoring = async () => {
    console.log('🔄 [AUTH STORE] Setting up session monitoring...')
    
    try {
      const { supabase } = await import('@/lib/supabaseClient')
      
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 [AUTH STORE] Auth state changed:', event)
        
        switch (event) {
          case 'TOKEN_REFRESHED':
            console.log('🔄 [AUTH STORE] Token refreshed automatically')
            if (session) {
              console.log('🔄 [AUTH STORE] New session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
              
              // Sync refreshed tokens with backend
              try {
                await apiService.post('/auth/session', {
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  provider_token: session.provider_token,
                  provider_refresh_token: session.provider_refresh_token
                })
                console.log('✅ [AUTH STORE] Backend synchronized with refreshed tokens')
              } catch (error) {
                console.warn('⚠️ [AUTH STORE] Failed to sync refreshed tokens with backend:', error)
              }
            }
            break
            
          case 'SIGNED_OUT':
            console.log('🔓 [AUTH STORE] User signed out via Supabase')
            user.value = null
            isAuthenticated.value = false
            authProvider.value = null
            break
            
          case 'SIGNED_IN':
            console.log('✅ [AUTH STORE] User signed in via Supabase')
            // Let the OAuth callback handle the session handoff
            break
        }
      })
      
      console.log('✅ [AUTH STORE] Session monitoring active')
    } catch (error) {
      console.error('❌ [AUTH STORE] Failed to setup session monitoring:', error)
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
    initializeAuth,
    setupSessionMonitoring
  }
})
