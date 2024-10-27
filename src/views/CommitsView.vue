<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row">
    <div class="flex-1 p-6">
      <div v-if="projectStore.isLoading" class="mb-6">
        <SkeletonForCommits />
      </div>

      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div class="w-full md:w-1/3">
            <BranchSelector />

            <div class="flex items-center gap-x-2 pt-6 w-full md:w-auto">
              <Checkbox id="terms1" @update:checked="toggleAuthorIncluded" />
              <div class="grid leading-none">
                <label for="terms1" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"> Include author name in the summary </label>
                <p class="text-sm text-muted-foreground">Group the Update Notes by Authors to see which developers contributed the most.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-x-2 w-full md:w-auto mt-4 md:mt-0">
            <CustomPopover @select-last-30-days="handleLast30Days" @select-last-90-days="handleLast90Days" @select-custom-date="handleCustomDate"></CustomPopover>
            <select v-model="aiResponseStore.outputLanguage" @update:modelValue="setOutputLanguage" class="w-full md:w-auto bg-gray-100 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 px-4 py-2">
              <option value="english">English</option>
              <option value="turkish">Turkish</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="german">German</option>
            </select>

            <button class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 shadow-md transition duration-200 flex items-center" @click="handleSelectedCommits">
              <i class="fas fa-file-alt mr-2"></i>
              Summarize
            </button>
          </div>
        </div>

        <DataTable :commits="commitStore.commits" :selectedCommits="commitStore.selectedCommits" @toggleSelection="toggleCommitSelection" />

        <div class="mt-4 flex justify-center">
          <button v-if="commitStore.isMore" @click="loadMore" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200">
            {{ commitStore.isLoading ? 'Loading...' : 'Load More' }}
          </button>
          <span v-else class="text-gray-500 text-sm"> No more commits to load. </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import 'tailwindcss/tailwind.css'
import { useProjectStore } from '../stores/project'
import SkeletonForCommits from '../components/SkeletonForCommits.vue'
import { generateCommitMessage } from '../services/OpenAIService'
import { useAiResponseStore } from '../stores/aiResponse'
import DataTable from '../components/commits/DataTable.vue'
import { Checkbox } from '../components/ui/checkbox'
import BranchSelector from '../components/commits/BranchSelector.vue'
import CustomPopover from '../components/commits/CustomPopover.vue'
import { useCommitStore } from '../stores/commit'
import { fetchProjectDetails as fetchProjectDetailsService, fetchBranches as fetchBranchesService, fetchCommits as fetchCommitsService, getCommitsBundle } from '../services/gitlabService'

const projectStore = useProjectStore()
const aiResponseStore = useAiResponseStore()
const isLoading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)
const commitStore = useCommitStore()
const route = useRoute()
const router = useRouter()

const setOutputLanguage = (language: string) => {
  aiResponseStore.setOutputLanguage(language)
}

const toggleAuthorIncluded = (value: boolean) => {
  aiResponseStore.setIsAuthorIncluded(value)
}
const loadMore = async () => {
  if (!commitStore.isMore || commitStore.isLoading) return
  commitStore.incrementCurrentPage()
  await fetchCommits()
}

const initializeData = async () => {
  isLoading.value = true
  try {
    await fetchBranches()
    await fetchCommits()
  } catch (error) {
    errorMessage.value = 'An error occurred while initializing data.'
  } finally {
    isLoading.value = false
  }
}

const fetchBranches = async () => {
  try {
    if (projectStore.projectId) {
      const branchesData = await fetchBranchesService(projectStore.projectId.toString())
      commitStore.setBranches(branchesData)
      console.log(commitStore.branches)
      if (commitStore.branches.length > 0) {
        commitStore.setSelectedBranch(commitStore.branches[0].name)
      }
    }
  } catch (error) {
    errorMessage.value = 'Failed to fetch branches'
  }
}

const fetchCommits = async () => {
  try {
    isLoading.value = true

    if (!commitStore.selectedBranch) {
      await fetchBranches()
      if (!commitStore.selectedBranch) {
        throw new Error('No branch selected')
      }
    }

    if (!projectStore.projectId) {
      throw new Error('No project ID available')
    }

    const { commits: fetchedCommits, totalCommits } = await fetchCommitsService(projectStore.projectId.toString(), commitStore.selectedBranch, commitStore.currentPage, commitStore.perPage, commitStore.since, commitStore.until)
  } catch (error) {
    errorMessage.value = 'Failed to fetch commits'
  } finally {
    isLoading.value = false
  }
}

const toggleCommitSelection = (commitId: string) => {
  if (commitStore.selectedCommits.includes(commitId)) {
    commitStore.setSelectedCommits(commitStore.selectedCommits.filter((id) => id !== commitId))
  } else {
    commitStore.setSelectedCommits([...commitStore.selectedCommits, commitId])
  }
}
const handleSelectedCommits = async () => {
  if (commitStore.selectedCommits.length > 0 && projectStore.projectId) {
    try {
      router.push({
        name: 'CommitSummaries',
        params: { id: projectStore.projectId }
      })

      const { commits: commitBundles } = await getCommitsBundle(projectStore.projectId.toString(), commitStore.selectedCommits)

      const commitMessage = await generateCommitMessage(commitBundles)
    } catch (error) {
      alert('An error occurred while summarizing commits.')
    }
  } else {
    alert('No commits selected or project ID is missing')
  }
}

const handleLast30Days = () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  commitStore.setSince(thirtyDaysAgo.toISOString())
  commitStore.setUntil(new Date().toISOString())
  commitStore.setPerPage(50)
  fetchCommits()
}

const handleLast90Days = () => {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  commitStore.setSince(ninetyDaysAgo.toISOString())
  commitStore.setUntil(new Date().toISOString())
  commitStore.setPerPage(100)
  fetchCommits()
}

const handleCustomDate = (date1: Date, date2: Date) => {
  commitStore.setSince(date1.toISOString())
  commitStore.setUntil(date2.toISOString())
  commitStore.setPerPage(100)
  fetchCommits()
}

onMounted(() => {
  initializeData()
})
onUnmounted(() => {
  commitStore.clearCommits()
})

watch(
  () => commitStore.selectedBranch,
  () => {
    commitStore.clearCommits()
    commitStore.resetPagination()
    fetchCommits()
  }
)
</script>
