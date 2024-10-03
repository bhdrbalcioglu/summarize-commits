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
          </div>

          <div class="w-full md:w-auto flex justify-center md:justify-end">
            <button
              class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 shadow-md transition duration-200 flex items-center"
              @click="handleSelectedCommits"
            >
              <i class="fas fa-file-alt mr-2"></i>
              Summarize
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full w-full bg-white shadow-inner rounded-lg">
            <thead class="bg-gray-200">
              <tr>
                <th
                  class="py-3 px-6 text-left text-sm font-semibold text-gray-700"
                >
                  Select
                </th>
                <th
                  class="py-3 px-6 text-left text-sm font-semibold text-gray-700"
                >
                  Commit Message
                </th>
                <th
                  class="py-3 px-6 text-left text-sm font-semibold text-gray-700"
                >
                  Date
                </th>
                <th
                  class="py-3 px-6 text-left text-sm font-semibold text-gray-700"
                >
                  Author
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="commit in commits"
                :key="commit.id"
                @click="toggleCommitSelection(commit.id)"
                :class="{
                  'bg-gray-100': selectedCommits.includes(commit.id),
                  'hover:bg-gray-50': true,
                  'cursor-pointer': true,
                }"
                class="border-b border-gray-200 transition duration-200"
              >
                <td class="py-4 px-6">
                  <input
                    type="checkbox"
                    :value="commit.id"
                    :checked="selectedCommits.includes(commit.id)"
                    @change="toggleCommitSelection(commit.id)"
                    @click.stop
                    class="w-6 h-6 rounded focus:ring-green-500 cursor-pointer transition-all duration-200 ease-in-out"
                  />
                </td>
                <td class="py-4 px-6">
                  <p class="font-semibold text-gray-800">
                    {{ commit.message }}
                  </p>
                </td>
                <td class="py-4 px-6">
                  <p class="text-sm text-gray-500">
                    {{
                      new Date(commit.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                  </p>
                </td>
                <td class="py-4 px-6">
                  <p class="text-sm text-gray-500">
                    {{ commit.committer_name }}
                  </p>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="py-4">
                  <div class="flex items-center justify-center">
                    <button
                      v-if="hasNextPage"
                      @click="fetchCommits"
                      class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                    >
                      Load More
                    </button>
                    <span v-else class="text-gray-500 text-sm">
                      No more commits to load.
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { useAuthStore } from "../stores/auth";
import { useProjectStore, Project } from "../stores/project";
import SkeletonCard from "../components/SkeletonCard.vue";
import { getCommitsBundle } from "../services/gitlabService";
import SkeletonForCommits from "../components/SkeletonForCommits.vue";
import { generateCommitMessage } from "../services/OpenAIService";
import ProjectCard from "../components/ProjectCard.vue";

const authStore = useAuthStore();
const projectStore = useProjectStore();

const projectId = ref<string | null>(null);
const branches = ref<Array<Record<string, any>>>([]);
const selectedBranch = ref<string>("main");
const commits = ref<Array<Record<string, any>>>([]);
const selectedCommits = ref<Array<string>>([]);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string | null>(null);
const currentPage = ref<number>(1);
const itemsPerPage = 10;

const hasNextPage = ref(true);
const isLoadingMore = ref(false);

const route = useRoute();
const router = useRouter();

const handleDataFetching = () => {
  isLoading.value = true;
  fetchProjectDetails();
  fetchBranches();
  fetchCommits();
  isLoading.value = false;
};

const fetchProjectDetails = async () => {
  try {
    projectId.value = projectStore.projectId?.toString() || null;
    projectStore.isLoading = true;
    const { data } = await axios.get(
      `https://gitlab.com/api/v4/projects/${projectId.value}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    );
    projectStore.setProjectDetails(data);
    console.log("Project Details:", projectStore.projectId);
  } catch (error) {
    errorMessage.value = "Failed to fetch project details";
  } finally {
  }
};

const fetchBranches = async () => {
  try {
    const response = await axios.get(
      `https://gitlab.com/api/v4/projects/${projectStore.projectId}/repository/branches`,
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    );
    branches.value = response.data;
    selectedBranch.value = branches.value[0]?.name || "";
  } catch (error) {
    errorMessage.value = "Failed to fetch branches";
  }
};

const fetchCommits = async () => {
  try {
    isLoadingMore.value = true;

    if (!selectedBranch.value) {
      await fetchBranches();
    }
    const response = await axios.get(
      `https://gitlab.com/api/v4/projects/${projectStore.projectId}/repository/commits`,
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        params: {
          ref_name: selectedBranch.value,
          per_page: itemsPerPage,
          page: currentPage.value,
        },
      }
    );
    const { data, headers } = response;

    if (currentPage.value === 1) {
      commits.value = data;
    } else {
      commits.value = [...commits.value, ...data];
    }

    hasNextPage.value = data.length === itemsPerPage;

    if (hasNextPage.value) {
      currentPage.value++;
    }
  } catch (error) {
    console.error("Error fetching commits:", error);
    errorMessage.value = "Failed to fetch commits";
  }
  isLoadingMore.value = false;
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
      const commitBundles = await getCommitsBundle(
        projectStore.projectId.toString(),
        selectedCommits.value
      );
      console.log("Commit Bundles:", commitBundles);

      // Pass the array of commits instead of the entire object
      const commitMessage = await generateCommitMessage(commitBundles.commits);
      console.log("Generated Commit Message:", commitMessage);
    } catch (error) {
      console.error("Error processing commits:", error);
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

watch(selectedBranch, () => {
  commits.value = [];
  currentPage.value = 1;
  fetchCommits();
});
</script>
