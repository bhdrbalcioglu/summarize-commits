<template>
  <div class="p-8 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">Groups</h5>

    <div v-if="loading" class="mt-6">
      <SkeletonTable />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead class="bg-gray-200">
          <tr>
            <th
              class="py-3 px-6 text-center text-xl font-semibold text-gray-700"
            >
              Logo
            </th>
            <th
              class="py-3 px-6 text-center text-xl font-semibold text-gray-700"
            >
              ID
            </th>
            <th
                class="py-3 px-6 text-center text-xl font-semibold text-gray-700"
            >
              Name
            </th>
           
            <th
              class="py-3 px-6 text-center text-xl font-semibold text-gray-700"
            >
              Visibility
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="group in groups"
            :key="group.id"
            class="hover:bg-gray-100 hover:text-retro-blue cursor-pointer transition duration-200"
            @click="navigateToGroupProjects(group)"
          >
            <td class="py-4 px-6 border-b text-center">
              <img
                :src="group.avatar_url"
                alt="Logo"
                class="w-12 h-12 rounded-full mx-auto"
              />
            </td>
            <td class="py-4 px-6 border-b text-center text-l text-gray-800">
              {{ group.id }}
            </td>
            <td class="py-4 px-6 border-b text-center text-l text-gray-800">
              {{ group.full_name }}
            </td>
           
            <td class="py-4 px-6 border-b text-center text-l text-gray-800">
              <span v-if="group.visibility === 'public'">
                <i class="fa-solid fa-eye"></i>
              </span>
              <span v-else-if="group.visibility === 'private'">
                <i class="fa-solid fa-lock"></i>
              </span>
              <span v-else>Unknown</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import axios from "axios";
import SkeletonTable from "../components/SkeletonTable.vue";
import { useRouter } from "vue-router";

interface Group {
  id: number;
  avatar_url: string;
  created_at: string;
  description: string;
  full_name: string;
  full_path: string;
  visibility: string;
}
const groups = ref<Group[]>([]);
const loading = ref(true);

const router = useRouter();

const navigateToGroupProjects = (group: Group) => {
  router
    .push({
      name: "ProjectsView",
      query: {
        groupId: group.id.toString(),
        groupName: group.full_name,
      },
    })
    .catch((err) => {
      console.error("Navigation Error:", err);
    });
};

const fetchGroups = async () => {
  try {
    const response = await axios.get("https://gitlab.com/api/v4/groups", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("gitlab_access_token")}`,
      },
    });

    groups.value = response.data;
    console.log(groups.value);
  } catch (error) {
    console.error("Failed to fetch groups:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGroups();
});
</script>

<style scoped>
@keyframes pulse {
  0% {
    background-color: #e0e0e0;
  }
  50% {
    background-color: #f0f0f0;
  }
  100% {
    background-color: #e0e0e0;
  }
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}
</style>
