<template>
  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
    <Table class="w-full">
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors">
          <TableHead 
            v-for="header in headerGroup.headers" 
            :key="header.id" 
            :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }"
            class="py-4 px-6 text-left font-semibold text-foreground"
          >
            <div 
              v-if="!header.isPlaceholder" 
              class="flex items-center space-x-2 cursor-pointer group transition-colors hover:text-primary" 
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              <template v-if="header.column.getCanSort()">
                <ArrowUp v-if="header.column.getIsSorted() === 'asc'" class="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                <ArrowDown v-else-if="header.column.getIsSorted() === 'desc'" class="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                <ChevronsUpDown v-else class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
            @click="handleRowClick(row.original)" 
            class="group cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-all duration-200 hover:shadow-sm" 
            :data-state="row.getIsSelected() ? 'selected' : ''"
          >
            <TableCell 
              v-for="cell in row.getVisibleCells()" 
              :key="cell.id"
              class="py-4 px-6 text-foreground group-hover:text-foreground transition-colors"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow class="hover:bg-transparent">
            <TableCell :colspan="tableColumns.length" class="h-32 text-center">
              <div class="flex flex-col items-center space-y-3">
                <div class="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <i class="fa-solid fa-folder-open text-xl text-muted-foreground"></i>
                </div>
                <div>
                  <p class="text-foreground font-medium">No projects found</p>
                  <p class="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts" generic="TData extends Project">
import { ref, watch, computed } from 'vue'
import { useVueTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, type SortingState, FlexRender, type ColumnDef } from '@tanstack/vue-table'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-vue-next'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table'
import type { Project } from '../../types/project'
import { columns as defineColumnsFunction } from './columns'
import { useProjectListStore } from '../../stores/projectListStore'
import type { ProjectOrderByOptions } from '../../types/projectList'

const props = defineProps<{
  projects: TData[]
}>()

const emit = defineEmits<{
  (e: 'rowClick', rowData: TData): void
}>()

const projectListStore = useProjectListStore()

const sorting = ref<SortingState>([{ id: projectListStore.orderBy, desc: projectListStore.sortOrder === 'desc' }])

// Since TData extends Project, and defineColumnsFunction returns ColumnDef<Project>[],
// this assignment is generally safe. If TypeScript still complains, an explicit cast might be needed,
// but it's usually better to ensure generic constraints allow this.
const tableColumns: ColumnDef<TData>[] = defineColumnsFunction as ColumnDef<TData>[]

const table = useVueTable({
  get data() {
    return props.projects
  },
  columns: tableColumns,
  state: {
    get sorting() {
      return sorting.value
    }
  },
  onSortingChange: (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
    sorting.value = newSorting
    if (newSorting.length > 0) {
      projectListStore.setSortAndFilterCriteria({
        orderBy: newSorting[0].id as ProjectOrderByOptions, // Cast is okay here as IDs are from Project type
        sortOrder: newSorting[0].desc ? 'desc' : 'asc'
      })
    } else {
      projectListStore.setSortAndFilterCriteria({
        orderBy: 'last_activity_at',
        sortOrder: 'desc'
      })
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getRowId: (row) => String(row.id) // Ensure getRowId returns a string
})

function handleRowClick(project: TData) {
  emit('rowClick', project)
}

watch(
  () => [projectListStore.orderBy, projectListStore.sortOrder],
  ([newOrderBy, newSortOrder]) => {
    const currentTableSortId = sorting.value[0]?.id
    const currentTableSortDesc = sorting.value[0]?.desc
    if (currentTableSortId !== newOrderBy || currentTableSortDesc !== (newSortOrder === 'desc')) {
      sorting.value = [{ id: newOrderBy, desc: newSortOrder === 'desc' }]
    }
  }
)
</script>
