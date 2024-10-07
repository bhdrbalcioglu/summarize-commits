import { defineStore } from "pinia";

export const useAiResponseStore = defineStore("aiResponse", {
  state: () => ({
    outputLanguage: "english" as string,
    aiResponseFirst: null as string | null,
    isLoadingFirst: true,
    aiResponseSecond: null as string | null,
    isLoadingSecond: true,
    isAuthorIncluded: false,
  }),
  actions: {
    setOutputLanguage(language: string) {
      this.outputLanguage = language;
    },
    setAiResponseFirst(response: string) {
      this.aiResponseFirst = response;
      this.isLoadingFirst = false;
    },
    setAiResponseSecond(response: string) {
      this.aiResponseSecond = response;
      this.isLoadingSecond = false;
    },
    resetAiResponse() {
      this.outputLanguage = "english";
      this.aiResponseFirst = null;
      this.aiResponseSecond = null;
      this.isLoadingFirst = true;
      this.isLoadingSecond = true;
      this.isAuthorIncluded = false;
    },
    setIsAuthorIncluded(isAuthorIncluded: boolean) {
      this.isAuthorIncluded = isAuthorIncluded;
    },
  },
});
