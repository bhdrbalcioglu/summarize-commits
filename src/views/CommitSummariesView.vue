<template>
  <div class="bg-gray-100 min-h-screen flex">
    <div class="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
      <ProjectCard
        :project="projectStore"
        :isLoading="projectStore.isLoading"
      />
    </div>
    <div class="flex-1 p-8 mx-4 px-5 overflow-hidden sm:px-6 lg:px-8">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-full">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-xl font-extrabold text-gray-800 flex items-center">
            <i class="fas fa-clipboard-list mr-3 text-green-500"></i>
            AI Generated Summary
          </h1>
          <button
            v-if="
              aiResponseStore &&
              displayedText === aiResponseStore.aiResponseSecond
            "
            class="flex items-center border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md px-4 py-2 transition transform hover:scale-105 duration-200"
            @click="changeDisplayedText"
          >
            <i class="fas fa-sliders-h mr-2"></i>
            AI Generated Analysis
          </button>
          <button
            v-else
            class="flex items-center border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md px-4 py-2 transition transform hover:scale-105 duration-200"
            @click="changeDisplayedText"
          >
            <i class="fas fa-sliders-h mr-2"></i>
            AI Generated Update Note
          </button>
        </div>
        <div
          class="ai-response font-mono text-lg leading-relaxed relative bg-gray-50 p-4 rounded-md shadow-inner"
        >
          <div
            v-if="isLoadingAIResponse"
            class="flex items-center justify-center py-10"
          >
            <i class="fas fa-spinner fa-spin text-3xl text-green-500"></i>
          </div>
          <pre v-else class="whitespace-pre-wrap break-words text-gray-800">
            <span v-for="(char, index) in displayedText" :key="index">{{ char }}</span>
          </pre>
        </div>
        <button
          v-show="displayedText"
          class="copy-button mt-6 px-5 py-3 bg-blue-600 text-white rounded-md flex items-center justify-center relative hover:bg-blue-700 transition duration-200"
          @click="copyToClipboard"
        >
          <i class="fas fa-copy mr-3"></i>
          Copy
          <div
            v-if="copiedMessageVisible"
            class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm rounded px-3 py-1 shadow-lg opacity-0 animate-fade-in"
          >
            <i class="fas fa-check mr-2"></i> Copied to Clipboard
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

<style>
/* Add the fade-in animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s forwards;
}
</style>
