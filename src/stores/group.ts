import { defineStore } from "pinia";

export interface Group {
  id: number;
  avatar_url: string;
  created_at: string;
  description: string;
  full_name: string;
  full_path: string;
  visibility: string;
  web_url: string;
  [key: string]: any; // Add this to accommodate any extra properties
}

export const useGroupStore = defineStore("group", {
  state: () => ({
    groups: [] as Group[],
    isLoading: false as boolean,
  }),
  actions: {
    async fetchGroups() {
      this.isLoading = true;
      try {
        const { getUserGroups } = await import("../services/gitlabService");
        const groupsData = await getUserGroups();
        this.groups = groupsData;
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        this.isLoading = false;
      }
    },
    clearGroups() {
      this.groups = [];
    },
  },
  persist: true,
});
