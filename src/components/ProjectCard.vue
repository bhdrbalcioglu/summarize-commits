<template>
  <div class="project-card-container">
    <div v-if="isLoading" class="w-full">
      <SkeletonCard />
    </div>
    <div
      v-else
      class="project-info text-center p-8 bg-white text-gray-800 rounded-lg shadow-md"
    >
      <h2 class="text-2xl font-semibold mb-4">
        {{ projectStore.projectName }}
      </h2>
      <h3
        v-if="projectStore.projectNamespace"
        class="text-xl font-semibold mb-4"
      >
        {{ projectStore.projectNamespace }}
      </h3>
      <div class="flex items-center justify-center mt-2">
        <span
          v-if="projectStore.projectVisibility === 'public'"
          class="text-xl font-bold flex items-center space-x-2 text-green-500"
        >
          <i class="fa-solid fa-eye"></i>
          <span>Public</span>
        </span>
        <span
          v-else-if="projectStore.projectVisibility === 'private'"
          class="text-xl font-bold flex items-center space-x-2 text-red-500"
        >
          <i class="fa-solid fa-lock"></i>
          <span v class="text-xl font-bold">Private</span>
        </span>
      </div>

      <p class="text-sm text-gray-600 mt-4">
        Created at:
        {{ formattedDate(projectStore.projectCreatedAt ?? "") }}
      </p>

      <p class="text-sm text-gray-600 mt-2">
        Default Branch:
        <span class="text-gray-800 text-lg font-bold">{{
          projectStore.projectDefaultBranch
        }}</span>
      </p>

      <p class="text-sm text-gray-600 mt-2">
        Last Activity:
        {{ formattedDate(projectStore.projectLastActivityAt ?? "") }}
      </p>

      <div v-if="projectStore.projectDescription" class="mt-6">
        <p class="text-sm text-gray-700">
          {{ projectStore.projectDescription }}
        </p>
      </div>
      <div v-else class="mt-6">
        <p class="text-sm italic text-gray-400">No description provided</p>
      </div>

      <div class="flex justify-center mt-6 space-x-6">
        <a
          :href="projectStore.projectUrl ?? '#'"
          class="text-blue-500 text-sm underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          URL
        </a>
      </div>

      <p class="text-sm text-gray-600 mt-6">
        ⭐ Stars: {{ projectStore.projectStarCount }} | 🍴 Forks:
        {{ projectStore.projectForksCount }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import SkeletonCard from "./SkeletonCard.vue";
import { useProjectStore } from "../stores/project";

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
});

const projectStore = useProjectStore();

const formattedDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>
