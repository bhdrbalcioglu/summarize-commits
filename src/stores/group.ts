import { defineStore } from "pinia";
import { Group } from "../types/group"; // Importing Group type

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
