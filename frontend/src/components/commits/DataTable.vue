<!-- frontend\src\components\commits\DataTable.vue -->
<template>
  <div class="bg-background/50 rounded-lg border border-border/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
    <div class="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="bg-muted/40 backdrop-blur-sm border-b border-border/50">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" :class="getHeaderClass(header.id)" class="transition-colors duration-200 hover:bg-muted/60">
              <div v-if="!header.isPlaceholder" class="flex items-center space-x-1">
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <template v-if="header.column.getCanSort()">
                  <div class="flex flex-col space-y-0.5 ml-2">
                    <button 
                      @click="() => header.column.toggleSorting(false)" 
                      :title="`Sort Ascending by ${header.column.id}`"
                      class="p-0.5 rounded hover:bg-primary/20 transition-all duration-200 transform hover:scale-110"
                      :class="{ 'text-primary bg-primary/10': header.column.getIsSorted() === 'asc', 'text-muted-foreground hover:text-foreground': header.column.getIsSorted() !== 'asc' }"
                    >
                      <ArrowUp class="h-3 w-3" />
                    </button>
                    <button 
                      @click="() => header.column.toggleSorting(true)" 
                      :title="`Sort Descending by ${header.column.id}`"
                      class="p-0.5 rounded hover:bg-primary/20 transition-all duration-200 transform hover:scale-110"
                      :class="{ 'text-primary bg-primary/10': header.column.getIsSorted() === 'desc', 'text-muted-foreground hover:text-foreground': header.column.getIsSorted() !== 'desc' }"
                    >
                      <ArrowDown class="h-3 w-3" />
                    </button>
                  </div>
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
              class="transition-all duration-200 group"
              :class="{
                'bg-primary/5 border-primary/20 shadow-sm': row.getIsSelected(),
                'hover:bg-muted/30 hover:shadow-sm': !row.getIsSelected()
              }"
            >
              <TableCell 
                v-for="cell in row.getVisibleCells()" 
                :key="cell.id" 
                :class="getCellClass(cell.column.id)"
                class="transition-colors duration-200 group-hover:bg-inherit"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="tableColumns.length" class="h-32 text-center">
                <div class="flex flex-col items-center space-y-4 py-8">
                  <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-code-commit text-2xl text-muted-foreground"></i>
                  </div>
                  <div class="text-center">
                    <h3 class="text-lg font-semibold text-foreground mb-2">No commits found</h3>
                    <p class="text-muted-foreground max-w-md">There are no commits matching the current filters. Try adjusting your search criteria or date range.</p>
                  </div>
                </div>
              </TableCell>
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
