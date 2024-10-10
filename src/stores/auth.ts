// src/stores/authStore.ts
import { defineStore } from "pinia";
import router from "../router";
import { useUserStore } from "./user";
import { acceptHMRUpdate } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authProvider: null as null | "GitLab" | "GitHub",
    accessToken: null as null | string,
  }),
  getters: {
    isLoggedIn: (state) => !!state.accessToken, // Check if accessToken exists
  },
  actions: {
    setAuthProvider(provider: "GitLab" | "GitHub" | null) {
      this.authProvider = provider;
    },
    setAccessToken(token: string) {
      this.accessToken = token;
    },
    logout() {
      this.authProvider = null;
      this.accessToken = null;
      router.push("/");
      console.log("Logged out");
      useUserStore().clearUser();
    },
  },
  persist: true,
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
