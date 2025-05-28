<template>
  <div class="flex flex-col lg:flex-row items-start justify-start min-h-screen p-4 sm:p-8 bg-gray-100">
    <div v-if="authStore.isLoading && !authStore.user" class="bg-white shadow-md rounded-lg p-6 w-full lg:max-w-sm lg:mr-8 text-center">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
      <p class="mt-2 text-gray-600">Loading user profile...</p>
    </div>
    <div v-else-if="authStore.user" class="bg-white shadow-md rounded-lg p-6 w-full lg:max-w-sm lg:mr-8 mb-6 lg:mb-0">
      <div class="flex flex-col items-center text-center">
        <img v-if="authStore.user.avatar_url" :src="authStore.user.avatar_url" alt="Profile Image" class="w-24 h-24 rounded-full mb-4 border-2 border-gray-200 shadow-sm" />
        <div v-else class="w-24 h-24 rounded-full mb-4 bg-gray-200 flex items-center justify-center text-gray-500 text-3xl">
          <i class="fas fa-user"></i>
        </div>

        <h1 class="text-2xl font-bold text-gray-800">{{ authStore.user.name }}</h1>
        <p class="text-lg text-gray-600">@{{ authStore.user.username }}</p>
        <p v-if="authStore.user.email" class="text-sm text-gray-500 mt-1">{{ authStore.user.email }}</p>
        <!-- Assuming 'location' and 'created_at' are part of the User type from backend -->
        <p v-if="currentUserDetails?.location" class="text-sm text-gray-500 mt-1">{{ currentUserDetails.location }}</p>
        <p v-if="currentUserDetails?.created_at" class="text-xs text-gray-400 mt-2">
          Member since:
          {{ currentUserDetails.created_at ? new Date(currentUserDetails.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' }}
        </p>

        <!-- Displaying provider -->
        <p class="text-sm text-gray-500 mt-2 capitalize">
          Account via: <span class="font-semibold">{{ authStore.user.provider }}</span>
        </p>

        <!-- Fields like public_email, state, linkedin_url, etc.
             Need to ensure these are part of the User type returned by your backend's /api/auth/me
             or if userStore is used to fetch additional details.
             For now, assuming they come from authStore.user or a hydrated currentUserDetails. -->

        <div v-if="currentUserDetails?.bio" class="mt-3 text-sm text-gray-600 text-left p-2 border-t border-gray-200">
          <h4 class="font-semibold mb-1">Bio:</h4>
          <p>{{ currentUserDetails.bio }}</p>
        </div>

        <div class="mt-4 space-x-4">
          <a v-if="authStore.user.web_url" :href="authStore.user.web_url" target="_blank" rel="noopener noreferrer" :title="`View on ${authStore.user.provider}`">
            <i :class="authStore.user.provider === 'gitlab' ? 'fa-brands fa-gitlab text-orange-500 text-xl' : 'fa-brands fa-github text-gray-700 text-xl'"></i>
          </a>
          <!-- Add other social links if available in User and if they make sense here -->
        </div>
      </div>
    </div>
    <div v-else-if="!authStore.isLoading && !authStore.user" class="bg-white shadow-md rounded-lg p-6 w-full lg:max-w-sm lg:mr-8 text-center">
      <p class="text-red-500">Could not load user profile. You might not be logged in.</p>
      <router-link to="/" class="mt-2 text-sm text-blue-500 hover:underline">Go to Home</router-link>
    </div>

    <div class="bg-white shadow-md rounded-lg p-6 w-full lg:flex-1 mt-6 lg:mt-0">
      <h2 class="text-xl font-bold mb-4 text-gray-800">Navigation</h2>
      <ul class="space-y-3">
        <li>
          <router-link to="/groups" class="flex items-center text-blue-600 hover:text-blue-800 hover:underline py-2 rounded-md transition-colors"> <i class="fa-solid fa-users mr-3 w-5 text-center"></i> Groups / Organizations </router-link>
          <hr class="my-1 border-t border-gray-200" />
        </li>
        <li>
          <router-link to="/projects" class="flex items-center text-blue-600 hover:text-blue-800 hover:underline py-2 rounded-md transition-colors"> <i class="fa-solid fa-folder-open mr-3 w-5 text-center"></i> All Projects </router-link>
          <hr class="my-1 border-t border-gray-200" />
        </li>
        <!-- Add more relevant navigation links here -->
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import type { User } from '../stores/userStore' // Import User type from userStore

const authStore = useAuthStore()
// const userStore = useUserStore(); // Only use if it holds data beyond what authStore.user provides

// This computed property assumes that your backend's /api/auth/me returns
// all the necessary user details (including bio, location, created_at etc.)
// and these are typed in the User interface in userStore.ts.
// If userStore was intended to fetch *additional* profile data not present in
// authStore.user, then you would fetch and use userStore.currentUser here.
const currentUserDetails = computed(() => {
  // For now, directly use authStore.user as it should be comprehensive
  return authStore.user as User & {
    // Explicitly type extra fields if they are optional in User but you expect them
    location?: string
    created_at?: string
    bio?: string
    // Add other extended profile fields if applicable from /auth/me response
  }
})

// The showUserStore function was for debugging, can be removed or kept.
// const showUserStore = () => {
//   console.log('Auth Store User:', authStore.user);
//   // console.log('Detailed User Store User:', userStore.currentUser);
// };

// onMounted: Data fetching is handled by authStore.initializeAuth() in main.ts
// or router guards. This view primarily displays the existing auth state.
// If this page could be landed on directly without authStore being initialized,
// you might add:
// onMounted(async () => {
//   if (!authStore.isUserAuthenticated && !authStore.isLoading) {
//     await authStore.fetchCurrentUser();
//   }
//   // If using userStore for additional details:
//   // if (authStore.isUserAuthenticated && !userStore.currentUser && !userStore.isLoading) {
//   //   await userStore.fetchExtendedUserProfile(authStore.user.id);
//   // }
// });
</script>
