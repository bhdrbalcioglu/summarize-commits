import { defineStore } from "pinia";

export const useAiResponseStore = defineStore("aiResponse", {
  state: () => ({
    aiResponseFirst: null as string | null,
    isLoadingFirst: true,
    aiResponseSecond: null as string | null,
    isLoadingSecond: true,
  }),
  actions: {
    setAiResponseFirst(response: string) {
      this.aiResponseFirst = response;
      this.isLoadingFirst = false;
    },
    setAiResponseSecond(response: string) {
      this.aiResponseSecond = response;
      this.isLoadingSecond = false;
    },
    resetAiResponse() {
      this.aiResponseFirst = null;
      this.aiResponseSecond = null;
      this.isLoadingFirst = true;
      this.isLoadingSecond = true;
    },
  },
});
