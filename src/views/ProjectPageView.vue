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

          <div class="flex items-center gap-x-2 w-full md:w-auto mt-4 md:mt-0">
            <CustomPopover
              @select-last-30-days="handleLast30Days"
              @select-last-90-days="handleLast90Days"
              @select-custom-date="handleCustomDate"
            ></CustomPopover>
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
          :commits="commitStore.commits"
          :selectedCommits="commitStore.selectedCommits"
          @toggleSelection="toggleCommitSelection"
        />

        <div class="mt-4 flex justify-center">
          <button
            v-if="commitStore.isMore"
            @click="loadMore"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
          >
            {{ commitStore.isLoading ? "Loading..." : "Load More" }}
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
import { ref, onMounted, watch, onUnmounted } from "vue";
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
import CustomPopover from "../components/commits/CustomPopover.vue";
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
const selectedBranch = ref<string>("");
// const commits = ref<Array<Record<string, any>>>([]);
const selectedCommits = ref<Array<string>>([]);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);
const currentPage = ref<number>(1);

const commitStore = useCommitStore();
const route = useRoute();
const router = useRouter();

const setOutputLanguage = (language: string) => {
  aiResponseStore.setOutputLanguage(language);
};

const toggleAuthorIncluded = (value: boolean) => {
  aiResponseStore.setIsAuthorIncluded(value);
};
const loadMore = async () => {
  if (!commitStore.isMore || commitStore.isLoading) return;
  console.log("Loading more commits");
  commitStore.incrementCurrentPage();
  console.log("Current page set to:", commitStore.currentPage);
  await fetchCommits();
};

const initializeData = async () => {
  isLoading.value = true;
  try {
    await fetchProjectDetails();
    await fetchBranches();
    if (branches.value.length > 0) {
      selectedBranch.value = branches.value[0].name;
    }
    await fetchCommits();
  } catch (error) {
    errorMessage.value = "An error occurred while initializing data.";
  } finally {
    isLoading.value = false;
  }
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
      if (branches.value.length > 0) {
        selectedBranch.value = branches.value[0].name;
      }
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch branches";
  }
};

const fetchCommits = async () => {
  try {
    isLoading.value = true;

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
      commitStore.perPage,
      commitStore.since,
      commitStore.until
    );
    console.log("Fetched Commits:", fetchedCommits);
  } catch (error) {
    errorMessage.value = "Failed to fetch commits";
  } finally {
    isLoading.value = false;
  }
};

const toggleCommitSelection = (commitId: string) => {
  if (commitStore.selectedCommits.includes(commitId)) {
    commitStore.setSelectedCommits(
      commitStore.selectedCommits.filter((id) => id !== commitId)
    );
  } else {
    commitStore.setSelectedCommits([...commitStore.selectedCommits, commitId]);
  }
};
const handleSelectedCommits = async () => {
  if (commitStore.selectedCommits.length > 0 && projectStore.projectId) {
    try {
      router.push({
        name: "CommitSummaries",
        params: { id: projectStore.projectId },
      });

      const { commits: commitBundles } = await getCommitsBundle(
        projectStore.projectId.toString(),
        commitStore.selectedCommits
      );

      const commitMessage = await generateCommitMessage(commitBundles);
    } catch (error) {
      alert("An error occurred while summarizing commits.");
    }
  } else {
    alert("No commits selected or project ID is missing");
    console.log(commitStore.selectedCommits, " selectedCommits.value");
    console.log(projectStore.projectId, " projectStore.projectId");
  }
};

const handleLast30Days = () => {
  console.log("Selecting commits from the last 30 days");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  commitStore.setSince(thirtyDaysAgo.toISOString());
  commitStore.setUntil(new Date().toISOString());
  console.log(commitStore.since, " commitStore.since");
  console.log(commitStore.until, " commitStore.until");
  fetchCommits();
};

const handleLast90Days = () => {
  console.log("Selecting commits from the last 90 days");
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  commitStore.setSince(ninetyDaysAgo.toISOString());
  console.log(commitStore.since, " commitStore.since");
  commitStore.setUntil(new Date().toISOString());
  console.log(commitStore.until, " commitStore.until");
  fetchCommits();
};

const handleCustomDate = (date: Date) => {
  // Implement the logic for selecting commits from the custom date
  console.log("Selecting commits from custom date:", date);
};

onMounted(() => {
  projectId.value = route.params.id as string;
  initializeData();
});
onUnmounted(() => {
  console.log("Unmounting ProjectPageView");
  commitStore.clearCommits();
});
watch(
  () => commitStore.commits,
  (newCommits) => {
    console.log("Commit Store Updated:", newCommits);
  }
);
watch(selectedBranch, () => {
  commitStore.clearCommits();
  commitStore.resetPagination();
  fetchCommits();
});

watch(commitStore.selectedCommits, () => {
  console.log("Selected Commits:", commitStore.selectedCommits);
});
</script>
