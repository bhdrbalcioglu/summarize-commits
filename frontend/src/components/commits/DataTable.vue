<!-- frontend\src\components\commits\DataTable.vue -->
<template>
  <div class="border rounded-md w-full">
    <div class="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" :class="getHeaderClass(header.id)">
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
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" :class="getCellClass(cell.column.id)">
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
  </div>
</template>
<script setup lang="ts" generic="TData extends Commit">
import { ref, computed, withDefaults, onMounted, onUnmounted, nextTick } from 'vue'
import { useVueTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, type SortingState, type RowSelectionState, type ColumnFiltersState, FlexRender } from '@tanstack/vue-table'
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

// Responsive column classes
const getHeaderClass = (columnId: string) => {
  switch (columnId) {
    case 'select':
      return 'w-12 text-center'
    case 'short_id':
      return 'w-20 sm:w-24'
    case 'title':
      return 'min-w-0 flex-1'
    case 'author_name':
      return 'w-24 sm:w-32 md:w-40'
    case 'authored_date':
      return 'w-32 sm:w-40 md:w-48'
    case 'web_url':
      return 'w-20 sm:w-24 md:w-32'
    default:
      return ''
  }
}

const getCellClass = (columnId: string) => {
  switch (columnId) {
    case 'select':
      return 'text-center align-top pt-3'
    case 'short_id':
      return 'font-mono text-xs sm:text-sm align-top pt-3'
    case 'title':
      return 'min-w-0 align-top pt-3'
    case 'author_name':
      return 'text-xs sm:text-sm truncate align-top pt-3'
    case 'authored_date':
      return 'text-xs sm:text-sm align-top pt-3'
    case 'web_url':
      return 'text-xs sm:text-sm align-top pt-3'
    default:
      return 'align-top pt-3'
  }
}

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
    const oldSel = rowSelection.value
    const newSel = typeof updaterOrValue === 'function' ? updaterOrValue(oldSel) : updaterOrValue

    /* Diff by commit-id keys */
    Object.keys({ ...oldSel, ...newSel }).forEach((id) => {
      const was = !!oldSel[id]
      const is = !!newSel[id]
      if (was !== is) emit('toggleSelection', id)
    })

    rowSelection.value = newSel
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
  if (isSelected) newRowSelectionState[commitId] = true
  else delete newRowSelectionState[commitId]
  rowSelection.value = newRowSelectionState
}

const syncSelectionFromProps = () => {
  const newRowSelectionState: RowSelectionState = {}
  props.selectedCommitIds.forEach((id) => {
    newRowSelectionState[id] = true
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
