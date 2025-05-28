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
import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useGroupStore, type Group } from '../stores/groupStore'
import SkeletonTable from '../components/SkeletonTable.vue'
import DataTable from '../components/groups/DataTable.vue'
import { columns } from '../components/groups/columns'
import { useEventBus } from '@/utils/eventBus'

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()

// Event-driven initialization
const { on, cleanup } = useEventBus()

const pageTitle = computed(() => {
  return authStore.currentProvider === 'github' ? 'Your Organizations' : 'Your Groups'
})

const initializeEventListeners = () => {
  // Listen for authentication changes
  on('AUTH_STATUS_CHANGED', ({ isAuthenticated, provider }) => {
    if (isAuthenticated && provider) {
      handleAuthenticationChange(provider)
    } else {
      groupStore.resetGroupState()
    }
  })

  // Listen for user logout
  on('USER_LOGGED_OUT', () => {
    groupStore.resetGroupState()
  })
}

const handleAuthenticationChange = async (provider: string) => {
  // Reset previous provider's groups and fetch new ones
  groupStore.resetGroupState()
  await groupStore.fetchGroups()
}

const navigateToGroupProjects = (group: Group) => {
  groupStore.selectGroup(group.id)
  router
    .push({
      name: 'ProjectsView',
      query: {
        groupName: group.name
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
  initializeEventListeners()
  
  if (authStore.isUserAuthenticated && authStore.currentProvider) {
    groupStore.fetchGroups()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>
