<template>
  <div class="bg-retro-white p-6 min-h-screen">
    <p class="text-xl text-retro-gray mt-6 text-center mx-20">
      <span v-html="displayedText"></span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const displayedText = ref("");
const welcomeText =
  "Welcome to the Git Summarizer. This project allows you to select the project you are working on, summarize, and create update notes for your selected commits using OpenAI's ChatGPT. You can login with your Gitlab <i class='fa-brands fa-gitlab'></i> and Github <i class='fa-brands fa-github'></i> accounts.";

const typeWriter = (text: string, i: number = 0) => {
  if (i < text.length) {
    displayedText.value = text.substring(0, i + 1);
    setTimeout(() => typeWriter(text, i + 1), 10);
  }
};

onMounted(() => {
  typeWriter(welcomeText);
});
</script>

<style scoped></style>
