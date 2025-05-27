<template>
  <div class="p-8 bg-gray-50 min-h-screen">
    <h5 class="text-2xl font-semibold mb-6 text-gray-800">
      {{ pageTitle }}
    </h5>
    <div v-if="authStore.isLoading || groupStore.isLoadingGroups" class="mt-6">
      <SkeletonTable :rows="5" :cols="columns.length" />
    </div>
    <div v-else-if="groupStore.groupError" class="mt-6 text-red-500 bg-red-100 p-4 rounded-md">
      <p>Error loading {{ authStore.currentProvider === 'github' ? 'organizations' : 'groups' }}:</p>
      <p>{{ groupStore.groupError }}</p>
      <button @click="retryFetchGroups" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
    </div>
    <div v-else-if="groupStore.allGroups.length === 0 && !groupStore.isLoadingGroups" class="mt-6 text-center text-gray-500">
      <p>No {{ authStore.currentProvider === 'github' ? 'organizations' : 'groups' }} found for your account.</p>
      <p v-if="authStore.currentProvider === 'github'">Ensure your GitHub organizations have granted access to this application if required.</p>
      <p v-else>You might not be a member of any GitLab groups, or there was an issue fetching them.</p>
      <button @click="retryFetchGroups" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Refresh</button>
    </div>
    <div v-else class="mt-6">
      <DataTable :columns="columns" :data="groupStore.allGroups" @rowClick="navigateToGroupProjects" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useGroupStore, type Group } from '../stores/groupStore' // Import Group type if not globally available
import SkeletonTable from '../components/SkeletonTable.vue'
import DataTable from '../components/groups/DataTable.vue' // Ensure DataTable can handle the Group type
import { columns } from '../components/groups/columns' // Ensure columns match Group type properties

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()

const pageTitle = computed(() => {
  return authStore.currentProvider === 'github' ? 'Your Organizations' : 'Your Groups'
})

const navigateToGroupProjects = (group: Group) => {
  // Use the aligned Group type
  groupStore.selectGroup(group.id) // Update selected group in store
  router
    .push({
      name: 'ProjectsView', // This route will now use projectListStore, which can get currentGroupId
      // from groupStore.selectedGroupId or have it passed if needed.
      // query parameters might still be useful for direct navigation/bookmarking,
      // but the primary state for filtering projects should be in projectListStore via groupStore.
      query: {
        // groupId: group.id.toString(), // Redundant if projectListStore uses selectedGroupId
        groupName: group.name // Was group.full_name, changed to group.name
      }
    })
    .catch((err) => {
      console.error('Navigation Error to ProjectsView:', err)
    })
}

const retryFetchGroups = () => {
  groupStore.fetchGroups()
}

onMounted(() => {
  if (authStore.isUserAuthenticated && authStore.currentProvider) {
    groupStore.fetchGroups()
  } else {
    // Handle case where user lands here without auth (e.g., direct navigation)
    // Router guards should ideally prevent this, but a fallback is good.
    // console.warn('GroupsView: User not authenticated or provider not set on mount.');
    // Or redirect: router.push({ name: 'Home' });
  }
})

// Watch for changes in authentication status or provider
watch(
  () => [authStore.isUserAuthenticated, authStore.currentProvider],
  ([isAuth, provider], [wasAuth, oldProvider]) => {
    if (isAuth && provider) {
      if (isAuth !== wasAuth || provider !== oldProvider || groupStore.allGroups.length === 0) {
        // If auth status changed, provider changed, or groups are not loaded yet
        groupStore.resetGroupState() // Clear previous provider's groups
        groupStore.fetchGroups()
      }
    } else {
      groupStore.resetGroupState() // Clear groups if user logs out or provider becomes null
    }
  },
  { immediate: false } // Don't run immediately, onMounted handles initial fetch
)
</script>
