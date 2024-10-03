<template>
  <div class="bg-gray-100 min-h-screen flex">
    <div class="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
      <ProjectCard
        :project="projectStore"
        :isLoading="projectStore.isLoading"
      />
    </div>
    <div class="flex-1 p-8 mx-4 px-5 overflow-hidden">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-full">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">AI Generated Summary</h1>
          <button
            v-if="
              aiResponseStore &&
              displayedText == aiResponseStore.aiResponseSecond
            "
            class="flex items-center border border-gray-300 rounded-md px-2 py-1"
            @click="changeDisplayedText"
          >
            <i class="fa-solid fa-sliders mr-2"></i>
            AI Generated Analysis
          </button>
          <button
            v-else
            class="flex items-center border border-gray-300 rounded-md px-2 py-1"
            @click="changeDisplayedText"
          >
            <i class="fa-solid fa-sliders mr-2"></i>
            AI Generated Update Note
          </button>
        </div>
        <div class="ai-response font-mono text-base leading-relaxed relative">
          <div v-if="isLoadingAIResponse" class="loading-indicator">
            Loading...
          </div>
          <pre v-else class="whitespace-pre-wrap break-words">
            <span v-for="(char, index) in displayedText" :key="index">{{ char }}</span>
          </pre>
        </div>
        <button
          v-show="displayedText"
          class="copy-button mt-4 px-4 py-2 bg-blue-500 text-white rounded relative"
          @click="copyToClipboard"
        >
          <i class="fas fa-copy mr-2"></i>
          Copy
          <div
            v-if="copiedMessageVisible"
            class="absolute top-1/2 left-full ml-2 cursor-default transform -translate-y-1/2 bg-gray-100 text-gray-700 text-sm rounded px-2 py-1 whitespace-nowrap"
          >
            Copied to Clipboard
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from "../stores/project";
import { useAiResponseStore } from "../stores/aiResponse";
import { ref, watch, onUnmounted } from "vue";
import ProjectCard from "../components/ProjectCard.vue";

const projectStore = useProjectStore();
const aiResponseStore = useAiResponseStore();
const copiedMessageVisible = ref(false);
const isLoadingAIResponse = ref(aiResponseStore.isLoadingSecond);

const displayedText = ref("");
let typewriterInterval: number | null = null;

const copyToClipboard = () => {
  const textToCopy = displayedText.value;
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      console.log("Text copied to clipboard");
      copiedMessageVisible.value = true;
      setTimeout(() => {
        copiedMessageVisible.value = false;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
};
const typeWriterEffect = (text: string) => {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }

  displayedText.value = "";

  let index = 0;
  const typingSpeed = 20;

  typewriterInterval = window.setInterval(() => {
    if (index < text.length) {
      displayedText.value += text.charAt(index);
      index++;
    } else {
      clearInterval(typewriterInterval as number);
      typewriterInterval = null;
    }
  }, typingSpeed);
};
const changeDisplayedText = () => {
  if (displayedText.value === aiResponseStore.aiResponseSecond) {
    displayedText.value = aiResponseStore.aiResponseFirst ?? "";
  } else {
    displayedText.value = aiResponseStore.aiResponseSecond ?? "";
  }
};

watch(
  () => aiResponseStore.aiResponseSecond,
  (newVal) => {
    if (newVal) {
      typeWriterEffect(newVal);
    }
  },
  { immediate: true }
);

watch(
  () => aiResponseStore.isLoadingSecond,
  (newVal) => {
    isLoadingAIResponse.value = newVal;
  }
);
onUnmounted(() => {
  console.log("CommitSummariesView unmounted");
  aiResponseStore.resetAiResponse();
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval);
  }
});
</script>
