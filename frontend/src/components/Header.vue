<template>
  <nav class="bg-primary p-4 flex flex-col md:flex-row justify-center md:justify-between items-center">
    <!-- Login Modal remains generic -->
    <LoginModal :modalActive="modalActive" @close-modal="toggleModal">
      <div class="max-w-lg w-full">
        <h1 class="text-3xl text-foreground text-center font-bold mb-6">Login to Continue</h1>
        <div class="flex flex-col space-y-4">
          <Button class="font-medium text-black py-2 px-4 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center w-full" @click="handleLogin('gitlab')" :disabled="authStore.isLoading">
            <i class="fa-brands fa-gitlab mr-2"></i>
            <span v.else>Login with GitLab</span>
          </Button>
          <Button class="font-medium text-white py-2 px-4 rounded-lg border border-input bg-gray-800 hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center w-full mt-2" @click="handleLogin('github')" :disabled="authStore.isLoading">
            <i class="fa-brands fa-github mr-2"></i>
            <span v.else>Login with GitHub</span>
          </Button>
        </div>
        <div v-if="authStore.error" class="mt-3 text-center text-red-500 text-sm">
          {{ authStore.error }}
        </div>
        <div class="flex justify-center mt-6">
          <Button variant="outline" class="py-2 px-4 rounded-lg" @click="toggleModal"> Cancel </Button>
        </div>
      </div>
    </LoginModal>

    <div class="w-full flex flex-col md:flex-row justify-center md:justify-between items-center mt-4 md:mt-0">
      <!-- Use authStore.currentUser for consistency, assuming userStore is simplified/removed or synced -->
      <h1 v-if="authStore.currentUser && route.name !== 'User'" class="text-3xl text-white text-center font-bold hover:text-muted-foreground cursor-pointer mx-auto" @click="pushToUserView">Git Commit Summarizer</h1>
      <h1 v.else class="text-3xl text-white text-center font-bold mx-auto">Git Commit Summarizer</h1>

      <div class="mt-4 md:mt-0 flex items-center">
        <div v-if="authStore.isUserAuthenticated && authStore.currentUser" class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <p class="text-white font-bold">Welcome, {{ authStore.currentUser?.name }}</p>
          <Button variant="ghost" class="text-sm text-muted-foreground hover:text-foreground" @click="handleLogout"> Logout? </Button>
        </div>
        <Button variant="outline" v-else class="mt-2 md:mt-0 w-full md:w-auto rounded-lg" @click="toggleModal" :disabled="authStore.isLoading"> Login </Button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import LoginModal from './LoginModal.vue' // This is your generic modal component
import { useAuthStore } from '../stores/authStore'
// import { useUserStore } from '../stores/userStore'; // Only if userStore holds distinct data not in authStore.currentUser
import { useRouter, useRoute } from 'vue-router'
import { Button } from './ui/button' // Assuming this is your ShadCN/UI Button

const modalActive = ref(false)
const authStore = useAuthStore()
// const userStore = useUserStore(); // If used, ensure it's for data beyond authStore.currentUser
const router = useRouter()
const route = useRoute()

const toggleModal = () => {
  modalActive.value = !modalActive.value
  if (!modalActive.value && authStore.error) {
    authStore.clearAuthError() // Clear error when modal is closed
  }
}

const pushToUserView = () => {
  // Prefer checking authStore.currentUser for navigation logic
  if (authStore.currentUser) {
    router.push('/user')
  }
}

const handleLogin = async (provider: 'gitlab' | 'github') => {
  // authStore.loginWithProvider will handle the window.location.href redirection
  // to your backend's /api/auth/login/:provider endpoint.
  await authStore.loginWithProvider(provider)
  // No need to toggleModal(false) here if the page navigates away.
  // If loginWithProvider throws an error that PREVENTS navigation,
  // the error will be in authStore.error and displayed in the modal.
}

const handleLogout = async () => {
  await authStore.logout()
  // authStore.logout action should handle redirecting to '/login' or '/' (HomeView)
  // If HomeView is the login page, it's fine.
  // If not, router.push('/') might be needed here if authStore.logout doesn't do it.
}

// Watch for authentication changes to close modal if login was successful elsewhere
// (e.g., if another tab completes login and this tab's /auth/me picks it up)
watch(
  () => authStore.isUserAuthenticated,
  (isAuth) => {
    if (isAuth && modalActive.value) {
      modalActive.value = false
    }
  }
)
</script>
