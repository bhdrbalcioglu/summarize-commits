<template>
  <div class="min-h-screen relative">
    <!-- Gradient Background System (matching other views) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-background/80 to-transparent"></div>

    <!-- Animated Background Orbs -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
      <div class="bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 p-8 md:p-12 max-w-md w-full">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent mb-2">Commit Summarizer</h1>
          <p class="text-muted-foreground text-lg">Transform your commits into professional release notes</p>
        </div>

        <!-- Login Buttons -->
        <div class="space-y-4">
          <button @click="login('github')" :disabled="authStore.isLoading" class="btn btn-github w-full">
            <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
            </svg>
            {{ authStore.isLoading ? 'Connecting...' : 'Sign in with GitHub' }}
          </button>

          <button @click="login('gitlab')" :disabled="authStore.isLoading" class="btn btn-gitlab w-full">
            <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M19.13 10.13l-1.07-3.28L16.8 2.7a.426.426 0 00-.81 0l-1.26 4.15H5.27L4.01 2.7a.426.426 0 00-.81 0L1.94 6.85.87 10.13a.851.851 0 00.31.95l9.32 6.77a.426.426 0 00.5 0l9.32-6.77a.851.851 0 00.31-.95z" />
            </svg>
            {{ authStore.isLoading ? 'Connecting...' : 'Sign in with GitLab' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="$route.query.error" class="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p class="text-destructive text-sm text-center">
            <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {{ getErrorMessage($route.query.error as string) }}
          </p>
        </div>

        <!-- Features Preview -->
        <div class="mt-8 pt-6 border-t border-border/30">
          <h3 class="text-sm font-semibold text-foreground mb-3 text-center">What you'll get:</h3>
          <div class="space-y-2 text-xs text-muted-foreground">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              AI-powered commit summarization
            </div>
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Professional release notes generation
            </div>
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Team collaboration tools
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

function login(provider: 'github' | 'gitlab') {
  console.log(`🔐 [LOGIN VIEW] Initiating ${provider} login...`)
  authStore.login(provider) // redirects to backend /api/auth/login/<provider>
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    no_tokens: 'Authentication failed. Please try again.',
    callback_failed: 'Login process encountered an error. Please try again.',
    unauthorized: 'Access denied. Please check your credentials.',
    cancelled: 'Login was cancelled. Please try again if you want to continue.'
  }

  return errorMessages[error] || 'An unexpected error occurred. Please try again.'
}
</script>

<style scoped>
.btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply hover:scale-105 hover:shadow-lg transform-gpu;
}

.btn-github {
  @apply bg-gray-900 text-white hover:bg-gray-800;
  @apply border border-gray-700 hover:border-gray-600;
}

.btn-gitlab {
  @apply bg-orange-600 text-white hover:bg-orange-700;
  @apply border border-orange-500 hover:border-orange-400;
}

.btn:disabled {
  @apply transform-none scale-100 shadow-none;
}
</style>
