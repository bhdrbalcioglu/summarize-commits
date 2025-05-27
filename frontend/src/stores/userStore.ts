// frontend/src/stores/userStore.ts
import { defineStore } from 'pinia'
// No apiClient needed if not making its own calls
// No useAuthStore needed here if authStore calls setUser on this store

// This User interface should be THE SAME as AuthUser in authStore.ts
// Ideally, define this in a shared types file, e.g., frontend/src/types/user.types.ts
export interface User {
  id: string | number
  username: string
  name: string
  avatar_url: string
  provider: 'gitlab' | 'github'
  email?: string | null
  web_url?: string
  // Optional extended fields if /auth/me provides them
  state?: string
  location?: string
  created_at?: string
  twitter_username?: string
  bio?: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null
    // isLoading and error might not be needed if this store doesn't do async ops
  }),
  actions: {
    // This action would be called by authStore after it successfully fetches the user
    // from /api/auth/me or when logging out.
    setCurrentUser(userData: User | null) {
      this.currentUser = userData
    }
    // clearUser is essentially setCurrentUser(null)
    // clearUser() {
    //   this.currentUser = null;
    // }
  }
})
