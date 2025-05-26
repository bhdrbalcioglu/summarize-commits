<template>
  <div class="flex items-center space-x-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm"> Authors <ChevronDown class="ml-2 h-4 w-4" /> </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56">
        <DropdownMenuLabel>Filter by Authors</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div class="flex flex-col max-h-60 overflow-y-auto">
          <DropdownMenuCheckboxItem class="hover:cursor-pointer hover:underline hover:bg-gray-100" v-for="author in authorsList" :key="author" :checked="isAuthorSelected(author)" @update:checked="(checked) => toggleAuthor(author, checked)">
            {{ author }}
          </DropdownMenuCheckboxItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Props {
  selectedAuthors: string[]
  authorsList: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedAuthors: () => [],
  authorsList: () => []
})

const emit = defineEmits<{
  (e: 'update:selectedAuthors', authors: string[]): void
}>()

const toggleAuthor = (author: string, checked: boolean) => {
  try {
    const newSelectedAuthors = checked ? [...props.selectedAuthors, author] : props.selectedAuthors.filter((a) => a !== author)
    console.log(`Author toggled: ${author}, Checked: ${checked}`, newSelectedAuthors)
    emit('update:selectedAuthors', newSelectedAuthors)
  } catch (error) {
    console.error('Error toggling author:', error)
  }
}

const isAuthorSelected = computed(() => (author: string) => props.selectedAuthors.includes(author))
</script>
