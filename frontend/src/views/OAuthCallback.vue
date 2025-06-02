<!-- frontend/src/views/OAuthCallback.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full mx-auto">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <!-- Loading State -->
        <div v-if="isProcessing" class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Processing authentication...</h2>
          <p class="text-gray-600 dark:text-gray-300">Please wait while we complete your login.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="text-center">
          <div class="rounded-full bg-green-100 dark:bg-green-900 p-3 w-16 h-16 mx-auto mb-4">
            <svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication successful!</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Redirecting to your dashboard...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center">
          <div class="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 mx-auto mb-4">
            <svg class="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication failed</h2>
          <p class="text-red-600 dark:text-red-400 mb-4">
            {{ error }}
          </p>
          <button @click="goHome" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">Return to Home</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '@/lib/supabaseClient'
import apiService from '@/services/apiService'

const router = useRouter()
const authStore = useAuthStore()

const isProcessing = ref(true)
const isSuccess = ref(false)
const error = ref<string | null>(null)

const goHome = () => {
  router.push('/')
}

const redirectToDashboard = () => {
  setTimeout(() => {
    router.push('/')
  }, 1500)
}

const handleCallback = async () => {
  console.log('🔗 [OAUTH CALLBACK] Starting new session handoff flow')

  try {
    isProcessing.value = true

    // 1️⃣ Listen for auth state changes to capture provider tokens
    let providerTokens: { provider_token?: string; provider_refresh_token?: string } = {}

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔑 [OAUTH CALLBACK] Auth state change:', { event, hasSession: !!session })

      if (session?.provider_token) {
        console.log('✅ [OAUTH CALLBACK] Captured provider tokens from auth state change')
        console.log('🔑 [REFRESH TOKEN DEBUG] Provider refresh token from auth state change:', {
          hasProviderRefreshToken: !!session.provider_refresh_token,
          providerRefreshTokenLength: session.provider_refresh_token?.length || 0,
          providerRefreshTokenPreview: session.provider_refresh_token ? session.provider_refresh_token.substring(0, 20) + '...' : 'null'
        })
        providerTokens = {
          provider_token: session.provider_token,
          provider_refresh_token: session.provider_refresh_token || undefined
        }
      }
    })

    // 2️⃣ Get current session
    const { data, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !data.session) {
      console.error('❌ [OAUTH CALLBACK] Failed to get session from URL:', sessionError)
      throw new Error('Failed to complete OAuth flow')
    }

    const { access_token, refresh_token } = data.session
    console.log('✅ [OAUTH CALLBACK] Got session tokens from Supabase')
    console.log('🔑 [REFRESH TOKEN DEBUG] Supabase session refresh token:', {
      hasRefreshToken: !!refresh_token,
      refreshTokenLength: refresh_token?.length || 0,
      refreshTokenPreview: refresh_token ? refresh_token.substring(0, 20) + '...' : 'null'
    })

    // 3️⃣ Check if we captured provider tokens from the session itself
    if (data.session.provider_token) {
      console.log('✅ [OAUTH CALLBACK] Found provider tokens in session')
      console.log('🔑 [REFRESH TOKEN DEBUG] Provider refresh token from session:', {
        hasProviderRefreshToken: !!data.session.provider_refresh_token,
        providerRefreshTokenLength: data.session.provider_refresh_token?.length || 0,
        providerRefreshTokenPreview: data.session.provider_refresh_token ? data.session.provider_refresh_token.substring(0, 20) + '...' : 'null'
      })
      providerTokens = {
        provider_token: data.session.provider_token,
        provider_refresh_token: data.session.provider_refresh_token || undefined
      }
    }

    // 4️⃣ Hand tokens to backend – sets HttpOnly cookies and gets user data
    console.log('🔗 [OAUTH CALLBACK] Sending tokens to backend for cookie setting')
    console.log('🔑 [OAUTH CALLBACK] Including provider tokens:', !!providerTokens.provider_token)
    console.log('🔑 [REFRESH TOKEN DEBUG] Final tokens being sent to backend:', {
      hasSupabaseRefreshToken: !!refresh_token,
      hasProviderRefreshToken: !!providerTokens.provider_refresh_token,
      supabaseRefreshTokenLength: refresh_token?.length || 0,
      providerRefreshTokenLength: providerTokens.provider_refresh_token?.length || 0,
      supabaseRefreshTokenPreview: refresh_token ? refresh_token.substring(0, 20) + '...' : 'null',
      providerRefreshTokenPreview: providerTokens.provider_refresh_token ? providerTokens.provider_refresh_token.substring(0, 20) + '...' : 'null'
    })

    const response = await apiService.post('/auth/session', {
      access_token,
      refresh_token,
      ...providerTokens // Include provider tokens if available
    })
    console.log('✅ [OAUTH CALLBACK] Backend session handoff successful')

    // Clean up auth listener
    authListener.subscription.unsubscribe()

    // 5️⃣ Use the user data returned from session handoff
    console.log('👤 [OAUTH CALLBACK] Using user data from session handoff response')
    if (response.data) {
      // Manually populate the auth store with the returned user data
      authStore.user = response.data
      authStore.isAuthenticated = true
      authStore.authProvider = response.data.provider
      console.log('✅ [OAUTH CALLBACK] Auth store populated with user:', response.data.username)
    } else {
      throw new Error('No user data returned from session handoff')
    }

    isSuccess.value = true
    isProcessing.value = false
    console.log('✅ [OAUTH CALLBACK] OAuth flow completed successfully')

    // Redirect after showing success message
    redirectToDashboard()
  } catch (err: any) {
    console.error('❌ [OAUTH CALLBACK] Authentication failed:', err)
    error.value = err.message || 'An unexpected error occurred during authentication'
    isProcessing.value = false
  }
}

onMounted(() => {
  handleCallback()
})
</script>
