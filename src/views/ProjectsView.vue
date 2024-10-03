<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">
      {{ groupName ? `${groupName} / Projects` : "Projects" }}
    </h5>

    <div
      class="flex flex-col md:flex-row md:justify-between items-center mb-6 space-y-4 md:space-y-0"
    >
      <div class="w-full md:w-1/3">
        <input
          type="text"
          v-model="searchTerm"
          @input="debouncedFetchProjects"
          placeholder="Search projects..."
          class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
        />
      </div>

      <div
        class="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4"
      >
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">Sort by:</span>
          <select
            v-model="orderBy"
            @change="fetchProjects"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
          >
            <option value="name">Name</option>
            <option value="created_at">Created Time</option>
            <option value="last_activity_at">Last Activity Time</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">Order:</span>
          <button
            @click="toggleSort('asc')"
            class="px-3 py-1 border border-gray-300 rounded-l-md bg-white hover:bg-gray-100 transition duration-200"
            :disabled="sortOrder === 'asc'"
          >
            <i
              class="fa-solid fa-caret-up"
              :class="{ 'opacity-50': sortOrder === 'asc' }"
            ></i>
          </button>
          <button
            @click="toggleSort('desc')"
            class="px-3 py-1 border border-gray-300 rounded-r-md bg-white hover:bg-gray-100 transition duration-200"
            :disabled="sortOrder === 'desc'"
          >
            <i
              class="fa-solid fa-caret-down"
              :class="{ 'opacity-50': sortOrder === 'desc' }"
            ></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading">
      <SkeletonTable />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead class="bg-gray-200">
          <tr>
            <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              Name
            </th>
            <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              Group
            </th>
            <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              Description
            </th>
            <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              Visibility
            </th>
            <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              Last Activity
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in projects"
            :key="project.id"
            class="hover:bg-gray-100 hover:text-retro-blue cursor-pointer transition duration-200"
            @click="navigateToProject(project)"
          >
            <td class="py-3 px-4 border-b text-sm text-gray-800">
              {{ project.name }}
            </td>
            <td class="py-3 px-4 border-b text-sm text-gray-800">
              {{ project.namespace?.name }}
            </td>
            <td class="py-3 px-4 border-b text-sm text-gray-800">
              {{ project.description }}
            </td>
            <td class="py-3 px-10 border-b text-sm text-gray-800">
              <span v-if="project.visibility === 'public'">
                <i class="fa-solid fa-eye"></i>
              </span>
              <span v-else-if="project.visibility === 'private'">
                <i class="fa-solid fa-lock"></i>
              </span>
              <span v-else>Unknown</span>
            </td>
            <td class="py-3 px-4 border-b text-sm text-gray-800">
              {{ new Date(project.last_activity_at).toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
    >
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Items per page:</span>
        <select
          v-model="itemsPerPage"
          @change="fetchProjects"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <button
          class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200"
          @click="prevPage"
          :disabled="currentPage === 1"
        >
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <span class="text-sm text-gray-700">
          Page <span class="font-semibold">{{ currentPage }}</span> of
          <span class="font-semibold">{{ totalPages }}</span>
        </span>
        <button
          class="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-200"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import SkeletonTable from "../components/SkeletonTable.vue";
import { useRouter, useRoute } from "vue-router";
import { Project, useProjectStore } from "../stores/project";
import { debounce } from "lodash-es";

const props = defineProps({
  groupId: {
    type: String,
    required: false,
  },
  groupName: {
    type: String,
    required: false,
  },
});

const router = useRouter();
const projects = ref<Project[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalPages = ref(1);

const totalProjects = ref(0);
const authStore = useAuthStore();
const projectStore = useProjectStore();

const orderBy = ref("name");
const sortOrder = ref("asc");
const route = useRoute();
// Search Term
const searchTerm = ref("");

const groupId = props.groupId;
const groupName = props.groupName;

// Debounced Fetch Projects
const debouncedFetchProjects = debounce(() => {
  currentPage.value = 1; // Reset to first page on new search
  fetchProjects();
}, 500);

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchProjects();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchProjects();
  }
};

const fetchProjects = () => {
  loading.value = true;

  // Determine the API endpoint based on whether a group is selected
  const url = groupId
    ? `https://gitlab.com/api/v4/groups/${groupId}/projects`
    : "https://gitlab.com/api/v4/projects";

  console.log("groupId:", groupId);
  console.log("groupName:", groupName);
  console.log("url:", url);
  axios
    .get(url, {
      params: {
        membership: true,
        order_by: orderBy.value,
        sort: sortOrder.value,
        per_page: itemsPerPage.value,
        page: currentPage.value,
        search: searchTerm.value || undefined,
      },
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    .then((response) => {
      projects.value = response.data;
      totalPages.value = parseInt(response.headers["x-total-pages"]) || 1;
      totalProjects.value = parseInt(response.headers["x-total"]) || 0;
      loading.value = false;
      console.log(" projects:", projects.value);
    })
    .catch((error) => {
      console.error("Failed to fetch projects:", error);
      loading.value = false;
    });
};

const navigateToProject = (project: Project) => {
  projectStore.setProjectDetails(project);
  console.log("projectStore:", projectStore);
  router.push({
    name: "ProjectPage",
    params: { name: project.name, id: project.id.toString() },
  });
};

const toggleSort = (direction: "asc" | "desc") => {
  sortOrder.value = direction;
  fetchProjects();
};

watch(orderBy, (newValue) => {
  if (newValue === "last_activity_at") {
    sortOrder.value = "desc";
  }
  toggleSort("desc");
});

onMounted(() => {
  fetchProjects();
});
</script>
