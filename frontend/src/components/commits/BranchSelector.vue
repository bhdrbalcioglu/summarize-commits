<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button 
        variant="outline" 
        role="combobox" 
        :aria-expanded="open" 
        class="w-[200px] justify-between" 
        :disabled="isDisabled"
      >
        <span class="flex items-center truncate">
          <span v-if="commitStore.statusBranches === 'loading'">
            <i class="fas fa-spinner fa-spin mr-2"></i>Loading branches...
          </span>
          <span v-else-if="currentSelectedBranch">
            {{ currentSelectedBranch.name }}
            <Badge v-if="currentSelectedBranch.is_default" variant="secondary" class="ml-2">Default</Badge>
          </span>
          <span v-else-if="commitStore.branches.length === 0 && commitStore.statusBranches === 'ready'">
            No branches available
          </span>
          <span v-else>
            Select branch...
          </span>
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0">
      <Command v-model="searchTerm">
        <CommandInput class="h-9" placeholder="Search branches..." />
        <CommandEmpty>
          {{ getEmptyMessage }}
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
import { cn } from '@/components/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCommitStore } from '@/stores/commitStore'
import { Badge } from '@/components/ui/badge'

const commitStore = useCommitStore()
const open = ref(false)
const searchTerm = ref('')

const currentSelectedBranch = computed(() => commitStore.activeBranch)

const filteredBranches = computed(() => {
  if (!searchTerm.value) {
    return commitStore.branches
  }
  return commitStore.branches.filter((branch) => 
    branch.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const isDisabled = computed(() => {
  return commitStore.statusBranches === 'loading' || 
         (commitStore.branches.length === 0 && commitStore.statusBranches === 'ready')
})

const getEmptyMessage = computed(() => {
  if (commitStore.statusBranches === 'loading') {
    return 'Loading branches...'
  }
  if (searchTerm.value && filteredBranches.value.length === 0) {
    return 'No branch found.'
  }
  if (commitStore.branches.length === 0) {
    return 'No branches available.'
  }
  return ''
})

const handleBranchSelect = (branchName: string) => {
  commitStore.selectBranch(branchName)
  open.value = false
  searchTerm.value = ''
}
</script>
