<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" role="combobox" :aria-expanded="open" class="w-[200px] justify-between" :disabled="commitStore.isLoadingBranches || commitStore.branches.length === 0">
        <span class="flex items-center truncate">
          {{ currentSelectedBranch?.name || (commitStore.isLoadingBranches ? 'Loading...' : 'Select branch...') }}
          <Badge v-if="currentSelectedBranch?.is_default" variant="secondary" class="ml-2">Default</Badge>
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0">
      <Command v-model="searchTerm">
        <CommandInput class="h-9" placeholder="Search branches..." />
        <CommandEmpty>
          {{ searchTerm && filteredBranches.length === 0 ? 'No branch found.' : commitStore.branches.length === 0 ? 'No branches available.' : '' }}
        </CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem v-for="branch in filteredBranches" :key="branch.name" :value="branch.name" @select="handleBranchSelect(branch.name)">
              <span class="flex items-center truncate">
                {{ branch.name }}
                <Badge v-if="branch.is_default" variant="outline" class="ml-auto">Default</Badge>
              </span>
              <Check :class="cn('ml-auto h-4 w-4 text-green-500', commitStore.selectedBranchName === branch.name ? 'opacity-100' : 'opacity-0')" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/components/lib/utils' // Assuming this is your utility for class names
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCommitStore } from '@/stores/commitStore'
import { Badge } from '@/components/ui/badge' // Assuming ShadCN/UI Badge

const commitStore = useCommitStore()
const open = ref(false)
const searchTerm = ref('') // For local filtering within the command input

// Uses the getter from the refactored commitStore
const currentSelectedBranch = computed(() => commitStore.activeBranch)

const filteredBranches = computed(() => {
  if (!searchTerm.value) {
    return commitStore.branches
  }
  return commitStore.branches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
})

const handleBranchSelect = (branchName: string) => {
  commitStore.selectBranch(branchName) // This action handles setting selectedBranchName and fetching commits
  open.value = false // Close the popover
  searchTerm.value = '' // Reset search term
}

// No onMounted needed here as branch fetching is triggered by the parent view (CommitsView)
// or by project selection. This component just displays and allows selection.
</script>
