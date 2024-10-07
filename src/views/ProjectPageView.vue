<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div
      class="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col items-center"
    >
      <div v-if="projectStore.isLoading" class="w-full">
        <SkeletonCard />
      </div>
      <ProjectCard
        v-else
        :project="projectStore"
        :isLoading="projectStore.isLoading"
      />
    </div>

    <div class="flex-1 p-6">
      <div v-if="projectStore.isLoading" class="mb-6">
        <SkeletonForCommits />
      </div>

      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0"
        >
          <div class="w-full md:w-1/3">
            <label for="branches" class="block text-gray-700 font-medium mb-2">
              Branches:
            </label>
            <select
              v-model="selectedBranch"
              id="branches"
              class="w-full bg-gray-100 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
            >
              <option
                v-for="branch in branches"
                :key="branch.name"
                :value="branch.name"
              >
                {{ branch.name }}
              </option>
            </select>

            <div class="flex items-center gap-x-2 pt-6 w-full md:w-auto">
              <Checkbox id="terms1" @update:checked="toggleAuthorIncluded" />
              <div class="grid leading-none">
                <label
                  for="terms1"
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include author name in the summary
                </label>
                <p class="text-sm text-muted-foreground">
                  Group the Update Notes by Authors to see which developers
                  contributed the most.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-x-2 w-full md:w-auto">
            <select
              v-model="aiResponseStore.outputLanguage"
              @update:modelValue="setOutputLanguage"
              class="w-full md:w-auto bg-gray-100 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 px-4 py-2"
            >
              <option value="english">English</option>
              <option value="turkish">Turkish</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="german">German</option>
            </select>
            <button
              class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 shadow-md transition duration-200 flex items-center"
              @click="handleSelectedCommits"
            >
              <i class="fas fa-file-alt mr-2"></i>
              Summarize
            </button>
          </div>
        </div>
        <DataTable
          :commits="commits as Commit[]"
          :selectedCommits="selectedCommits"
          @toggleSelection="toggleCommitSelection"
        />

        <div class="mt-4 flex justify-center">
          <button
            v-if="commitStore.isMore"
            @click="fetchCommits"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
            :disabled="isLoadingMore"
          >
            {{ isLoadingMore ? "Loading..." : "Load More" }}
          </button>
          <span v-else class="text-gray-500 text-sm">
            No more commits to load.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import "tailwindcss/tailwind.css";
import { useProjectStore } from "../stores/project";
import SkeletonCard from "../components/SkeletonCard.vue";
import SkeletonForCommits from "../components/SkeletonForCommits.vue";
import { generateCommitMessage } from "../services/OpenAIService";
import ProjectCard from "../components/ProjectCard.vue";
import { useAiResponseStore } from "../stores/aiResponse";
import DataTable from "../components/commits/DataTable.vue";
import type { Commit } from "../types/commit";
import { Checkbox } from "../components/ui/checkbox/";

import { useCommitStore } from "../stores/commit";
import {
  fetchProjectDetails as fetchProjectDetailsService,
  fetchBranches as fetchBranchesService,
  fetchCommits as fetchCommitsService,
  getCommitsBundle,
} from "../services/gitlabService";

const projectStore = useProjectStore();
const aiResponseStore = useAiResponseStore();

const projectId = ref<string | null>(null);
const branches = ref<Array<Record<string, any>>>([]);
const selectedBranch = ref<string>("main");
const commits = ref<Array<Record<string, any>>>([]);
const selectedCommits = ref<Array<string>>([]);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);
const currentPage = ref<number>(1);

const hasNextPage = ref(true);
const isLoadingMore = ref(false);
const commitStore = useCommitStore();
const route = useRoute();
const router = useRouter();

const setOutputLanguage = (language: string) => {
  aiResponseStore.setOutputLanguage(language);
};

const toggleAuthorIncluded = (value: boolean) => {
  aiResponseStore.setIsAuthorIncluded(value);
};

const handleDataFetching = async () => {
  isLoading.value = true;
  await fetchProjectDetails();
  await fetchBranches();
  await fetchCommits();
  isLoading.value = false;
};

const fetchProjectDetails = async () => {
  try {
    projectId.value = projectStore.projectId?.toString() || null;
    if (projectId.value) {
      await fetchProjectDetailsService(projectId.value);
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch project details";
  }
};

const fetchBranches = async () => {
  try {
    if (projectStore.projectId) {
      const branchesData = await fetchBranchesService(
        projectStore.projectId.toString()
      );
      branches.value = branchesData;
      selectedBranch.value = branches.value[0]?.name || "";
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch branches";
  }
};

const fetchCommits = async () => {
  try {
    isLoadingMore.value = true;

    if (!selectedBranch.value) {
      await fetchBranches();
      if (!selectedBranch.value) {
        throw new Error("No branch selected");
      }
    }

    if (!projectStore.projectId) {
      throw new Error("No project ID available");
    }

    const { commits: fetchedCommits, totalCommits } = await fetchCommitsService(
      projectStore.projectId.toString(),
      selectedBranch.value,
      commitStore.currentPage,
      commitStore.itemsPerPage
    );

    if (currentPage.value === 1) {
      commits.value = fetchedCommits;
    } else {
      commits.value = [...commits.value, ...fetchedCommits];
    }

    hasNextPage.value = commits.value.length < totalCommits;

    if (hasNextPage.value) {
      currentPage.value++;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch commits";
  } finally {
    isLoadingMore.value = false;
  }
};

const toggleCommitSelection = (commitId: string) => {
  if (selectedCommits.value.includes(commitId)) {
    selectedCommits.value = selectedCommits.value.filter(
      (id) => id !== commitId
    );
  } else {
    selectedCommits.value.push(commitId);
  }
};
const handleSelectedCommits = async () => {
  if (selectedCommits.value.length > 0 && projectStore.projectId) {
    try {
      router.push({
        name: "CommitSummaries",
        params: { id: projectStore.projectId },
      });

      const { commits: commitBundles } = await getCommitsBundle(
        projectStore.projectId.toString(),
        selectedCommits.value
      );

      const commitMessage = await generateCommitMessage(commitBundles);
    } catch (error) {
      alert("An error occurred while summarizing commits.");
    }
  } else {
    alert("No commits selected or project ID is missing");
  }
};

onMounted(() => {
  projectId.value = route.params.id as string;
  handleDataFetching();
});
onUnmounted(() => {
  console.log("Unmounting ProjectPageView");
  commitStore.clearCommits();
});

watch(selectedBranch, () => {
  commits.value = [];
  currentPage.value = 1;

  if (currentPage.value > 1) {
    fetchCommits();
  }
});
</script>
