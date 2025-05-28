<!-- frontend\src\components\commits\DataTable.vue -->
<template>
  <div class="border rounded-md overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id" :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }">
            <div v-if="!header.isPlaceholder" class="flex items-center space-x-1">
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              <template v-if="header.column.getCanSort()">
                <button @click="() => header.column.toggleSorting(false)" :title="`Sort Ascending by ${header.column.id}`">
                  <ArrowUp class="h-3 w-3" :class="{ 'text-blue-500': header.column.getIsSorted() === 'asc' }" />
                </button>
                <button @click="() => header.column.toggleSorting(true)" :title="`Sort Descending by ${header.column.id}`">
                  <ArrowDown class="h-3 w-3" :class="{ 'text-blue-500': header.column.getIsSorted() === 'desc' }" />
                </button>
              </template>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() && 'selected'"
            :class="{
              'bg-blue-50 dark:bg-blue-900/30': row.getIsSelected(),
              'hover:bg-muted/50': true
            }"
            @click="() => row.toggleSelected()"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="tableColumns.length" class="h-24 text-center"> No commits found. </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts" generic="TData extends Commit">
import { ref, computed, withDefaults, onMounted, onUnmounted, nextTick } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  FlexRender
} from '@tanstack/vue-table'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table'
import type { Commit } from '../../types/commit'
import { columns as defineColumnsFunction } from './columns'
import { useEventBus } from '@/utils/eventBus'

const props = withDefaults(
  defineProps<{
    commits: TData[]
    selectedCommitIds: string[]
  }>(),
  {
    selectedCommitIds: () => []
  }
)

const emit = defineEmits<{
  (e: 'toggleSelection', commitId: string): void
}>()

const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})
const columnFilters = ref<ColumnFiltersState>([])

// For author filtering, if defineColumns needs these reactively
const selectedAuthorsForFilter = ref<string[]>([])
const allAuthorsList = computed(() => {
  return Array.from(new Set(props.commits.map((commit) => commit.author.name)))
})

// Pass the reactive refs to the columns definition function
const tableColumns = computed(() => defineColumnsFunction(selectedAuthorsForFilter, allAuthorsList))

// Event-driven initialization
const { on, cleanup } = useEventBus()

const table = useVueTable({
  get data() {
    return props.commits
  },
  columns: tableColumns.value,
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get columnFilters() {
      return columnFilters.value
    }
  },
  enableRowSelection: true,
  onRowSelectionChange: (updaterOrValue) => {
    const oldSelection = { ...rowSelection.value }
    const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(oldSelection) : updaterOrValue
    const allRowIndexes = new Set([...Object.keys(oldSelection), ...Object.keys(newSelection)])

    allRowIndexes.forEach((stringIndex) => {
      const index = Number(stringIndex)
      const wasSelected = !!oldSelection[index]
      const isSelected = !!newSelection[index]
      if (wasSelected !== isSelected && props.commits[index]) {
        emit('toggleSelection', props.commits[index].id)
      }
    })
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getRowId: (row) => row.id
})

// Event-driven selection sync
const initializeEventListeners = () => {
  // Listen for external selection changes
  on('COMMIT_SELECTION_CHANGED', ({ commitId, isSelected }) => {
    syncSelectionFromEvent(commitId, isSelected)
  })

  // Listen for commits loaded to reset selection state
  on('COMMITS_LOADED', () => {
    nextTick(() => {
      syncSelectionFromProps()
    })
  })
}

const syncSelectionFromEvent = (commitId: string, isSelected: boolean) => {
  const newRowSelectionState: RowSelectionState = { ...rowSelection.value }
  const rowIndex = props.commits.findIndex(commit => commit.id === commitId)
  
  if (rowIndex !== -1) {
    if (isSelected) {
      newRowSelectionState[rowIndex] = true
    } else {
      delete newRowSelectionState[rowIndex]
    }
    rowSelection.value = newRowSelectionState
  }
}

const syncSelectionFromProps = () => {
  if (!props.selectedCommitIds || !Array.isArray(props.selectedCommitIds)) return

  const newRowSelectionState: RowSelectionState = {}
  table.getRowModel().rows.forEach((row) => {
    if (props.selectedCommitIds.includes(row.original.id)) {
      newRowSelectionState[row.id] = true
    }
  })
  rowSelection.value = newRowSelectionState
}

const updateAuthorFilter = () => {
  const authorFilter = table.getColumn('author_name')
  if (authorFilter) {
    authorFilter.setFilterValue(selectedAuthorsForFilter.value.length > 0 ? selectedAuthorsForFilter.value : undefined)
  }
}

onMounted(() => {
  initializeEventListeners()
  
  // Initial sync
  nextTick(() => {
    syncSelectionFromProps()
  })
})

onUnmounted(() => {
  cleanup()
})

// Reactive updates for author filtering
const handleAuthorFilterChange = () => {
  updateAuthorFilter()
}

// Expose method for author filter updates
defineExpose({
  updateAuthorFilter: handleAuthorFilterChange,
  selectedAuthorsForFilter
})
</script>
