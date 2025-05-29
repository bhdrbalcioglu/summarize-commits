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
  location?: string | null
  created_at?: string
  twitter_username?: string | null
  bio?: string | null
  
  // Enhanced profile fields
  company?: string | null
  website_url?: string | null
  linkedin?: string | null
  discord?: string | null
  public_email?: string | null
  job_title?: string | null
  pronouns?: string | null
  public_repos?: number
  followers?: number
  following?: number
  updated_at?: string
  last_activity_on?: string
  hireable?: boolean | null
  is_bot?: boolean
  
  // Provider-specific metadata
  provider_metadata?: {
    github?: {
      public_gists?: number
      blog?: string | null
    }
    gitlab?: {
      theme_id?: number
      color_scheme_id?: number
      last_sign_in_at?: string
      current_sign_in_at?: string
      confirmed_at?: string
    }
  }
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
