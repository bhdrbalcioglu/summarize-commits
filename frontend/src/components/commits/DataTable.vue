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
// Removed TValue as it wasn't explicitly used and TData covers Commit
import { ref, watch, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  FlexRender,
  type Row // Import Row type for 'r' parameter
} from '@tanstack/vue-table'
import { ArrowUp, ArrowDown } from 'lucide-vue-next'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table'
import type { Commit } from '../../types/commit'
import { columns as defineColumnsFunction } from './columns'

const props = defineProps<{
  commits: TData[]
  selectedCommitIds: string[]
}>()

const emit = defineEmits<{
  (e: 'toggleSelection', commitId: string): void
}>()

const sorting = ref<SortingState>([])
const rowSelection = ref<RowSelectionState>({})
const columnFilters = ref<ColumnFiltersState>([])

// For author filtering, if defineColumns needs these reactively
const selectedAuthorsForFilter = ref<string[]>([]) // This will be updated by AuthorFilterHeader
const allAuthorsList = computed(() => {
  // Ensure author is correctly accessed. Assuming `commit.author` is an object with a `name` property.
  return Array.from(new Set(props.commits.map((commit) => commit.author.name)))
})

// Pass the reactive refs to the columns definition function
const tableColumns = computed(() => defineColumnsFunction(selectedAuthorsForFilter, allAuthorsList))

const table = useVueTable({
  get data() {
    return props.commits
  },
  columns: tableColumns.value, // Use the computed columns
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
    // rowSelection.value is updated by the watcher based on props.selectedCommitIds
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  onColumnFiltersChange: (updaterOrValue) => {
    // This is where the columnFilters ref is updated when AuthorFilterHeader changes selectedAuthorsForFilter
    // TanStack table will automatically use this for filtering if the column's filterFn is set
    columnFilters.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getRowId: (row) => row.id
})

// Watch selectedAuthorsForFilter (updated by AuthorFilterHeader) to set table's columnFilters
watch(
  selectedAuthorsForFilter,
  (newAuthors) => {
    const authorFilter = table.getColumn('author_name') // Assuming 'author_name' is the column ID
    if (authorFilter) {
      authorFilter.setFilterValue(newAuthors.length > 0 ? newAuthors : undefined)
    }
  },
  { deep: true }
)

watch(
  () => props.selectedCommitIds,
  (newSelectedIds) => {
    const newRowSelectionState: RowSelectionState = {}
    // Use table.value to access the table instance
    table.getRowModel().rows.forEach((row) => {
      if (newSelectedIds.includes(row.original.id)) {
        newRowSelectionState[row.id] = true // Use row.id (which is commit.id due to getRowId)
      }
    })
    rowSelection.value = newRowSelectionState
  },
  { immediate: true, deep: true }
)

watch(
  () => props.commits,
  (newCommits) => {
    // When commits prop changes, re-sync the selection state
    const newRowSelectionState: RowSelectionState = {}
    // Use table.value here as well
    const currentRows = table.getRowModel().rows
    currentRows.forEach((row) => {
      if (props.selectedCommitIds.includes(row.original.id)) {
        newRowSelectionState[row.id] = true
      }
    })
    rowSelection.value = newRowSelectionState
  },
  { deep: true }
)
</script>
