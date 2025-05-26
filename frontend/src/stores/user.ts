import { defineStore } from 'pinia'
import { acceptHMRUpdate } from 'pinia'

export interface User {
  id: number
  username: string
  name: string
  avatar_url: string
  email: string | null
  state: string
  location: string
  created_at: string
  linkedin_url: string
  twitter_url: string
  website_url: string
  public_email: string
  bio: string
  skype: string
  linkedin: string
  twitter: string
  website: string
  discord: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null
  }),
  actions: {
    setUser(userData: User) {
      this.user = userData
    },
    clearUser() {
      this.user = null
    }
  },
  persist: true
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
