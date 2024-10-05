<template>
  <div class="p-8 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">Groups</h5>

    <div v-if="groupStore.isLoading" class="mt-6">
      <SkeletonTable />
    </div>

    <div v-else class="mt-6">
      <DataTable
        :columns="columns"
        :data="groupStore.groups"
        @rowClick="navigateToGroupProjects"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGroupStore } from "../stores/group";
import SkeletonTable from "../components/SkeletonTable.vue";
import DataTable from "../components/groups/DataTable.vue";
import { columns } from "../components/groups/columns";

const router = useRouter();
const groupStore = useGroupStore();

const navigateToGroupProjects = (group: {
  id: number | string;
  full_name: string;
}) => {
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

onMounted(() => {
  groupStore.fetchGroups();
});
</script>
