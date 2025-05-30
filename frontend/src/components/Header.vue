<template>
  <nav class="border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo Section -->
        <div class="flex items-center">
          <h1 class="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent cursor-pointer hover:from-primary/80 hover:to-primary/60 transition-all duration-300" @click="navigateToHome">Git Commit Summarizer</h1>
        </div>

        <!-- User Controls -->
        <div class="flex items-center space-x-4">
          <!-- Dark Mode Toggle (when not authenticated) -->
          <Button v-if="!authStore.isUserAuthenticated" variant="ghost" size="sm" @click="handleThemeToggle" :class="['relative h-10 w-10 p-0 rounded-full transition-all duration-300 hover:scale-110', 'border border-border/30 hover:border-border/50 hover:bg-accent/20']" :title="themeStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
            <Sun v-if="!themeStore.isDarkMode" class="h-4 w-4 text-yellow-500 transition-all duration-300" />
            <Moon v-else class="h-4 w-4 text-blue-400 transition-all duration-300" />
          </Button>

          <!-- Unauthenticated: Login Button -->
          <Button v-if="!authStore.isUserAuthenticated" variant="default" @click="toggleModal" :disabled="authStore.isLoading" class="relative overflow-hidden transition-all duration-300 hover:scale-105" data-login-button>
            <span v-if="authStore.isLoading" class="mr-2">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            </span>
            <span class="relative z-10">Login</span>
          </Button>

          <!-- Authenticated: User Dropdown -->
          <UserDropdownMenu v-else />
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal :modalActive="modalActive" @close-modal="toggleModal">
      <div class="max-w-lg w-full">
        <h1 class="text-3xl text-foreground text-center font-bold mb-6">Login to Continue</h1>
        <div class="flex flex-col space-y-4">
          <!-- GitLab Button -->
          <Button class="font-medium py-3 px-4 rounded-lg bg-orange-800 hover:bg-orange-600 text-white border-0 transition-colors focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 flex items-center justify-center w-full shadow-lg hover:shadow-xl" @click="handleLogin('gitlab')" :disabled="authStore.isLoading">
            <i class="fa-brands fa-gitlab mr-2"></i>
            <span>Login with GitLab</span>
          </Button>

          <!-- GitHub Button -->
          <Button class="font-medium py-3 px-4 rounded-lg bg-gray-900 hover:bg-gray-600 text-white border-0 transition-colors focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 flex items-center justify-center w-full shadow-lg hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700" @click="handleLogin('github')" :disabled="authStore.isLoading">
            <i class="fa-brands fa-github mr-2"></i>
            <span>Login with GitHub</span>
          </Button>
        </div>
        <div class="flex justify-center mt-6">
          <Button variant="outline" class="py-2 px-4 rounded-lg" @click="toggleModal"> Cancel </Button>
        </div>
      </div>
    </LoginModal>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import LoginModal from './LoginModal.vue'
import UserDropdownMenu from './UserDropdownMenu.vue'
import { Button } from './ui/button'
import { useThemeStore } from '../stores/themeStore'
import { useThemeTransition } from '@/composables/useThemeTransition'
import { Sun, Moon } from 'lucide-vue-next'

const modalActive = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const themeStore = useThemeStore()
const { runThemeTransition } = useThemeTransition()

const toggleModal = () => {
  modalActive.value = !modalActive.value
}

const navigateToHome = () => {
  if (authStore.user) {
    router.push('/user')
  } else {
    router.push('/')
  }
}

const handleLogin = async (provider: 'gitlab' | 'github') => {
  await authStore.loginWithProvider(provider)
}

const handleThemeToggle = () => {
  runThemeTransition()
}

// Watch for authentication changes to close modal if login was successful
watch(
  () => authStore.isUserAuthenticated,
  (isAuth) => {
    if (isAuth && modalActive.value) {
      modalActive.value = false
    }
  }
)
</script>

<style scoped>
/* Enhanced transitions for smooth interactions */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Backdrop filter support */
@supports (backdrop-filter: blur(20px)) {
  .supports-\[backdrop-filter\]\:bg-background\/60 {
    background-color: hsl(var(--background) / 0.6);
  }
}
</style>
