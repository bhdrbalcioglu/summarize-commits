<template>
  <div class="border rounded-md">
    <Table>
      <!-- Table Header -->
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <div v-if="!header.isPlaceholder">
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <!-- Table Body -->
      <TableBody>
        <template v-if="table.getRowModel().rows.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id" @click="handleRowClick(row)" class="cursor-pointer hover:bg-gray-100">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="props.columns.length" class="h-24 text-center"> No results. </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVueTable, getCoreRowModel, getSortedRowModel, type ColumnDef, type SortingState } from '@tanstack/vue-table'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table'
import { FlexRender } from '@tanstack/vue-table'
import type { Group } from '../../types/group'
import { valueUpdater } from '../lib/utils'

const props = defineProps<{
  columns: ColumnDef<Group>[]
  data: Group[]
}>()

const emit = defineEmits<{
  (e: 'rowClick', rowData: Group): void
}>()

const sorting = ref<SortingState>([])

const table = useVueTable<Group>({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  state: {
    get sorting() {
      return sorting.value
    }
  }
})

function handleRowClick(row: any) {
  emit('rowClick', row.original)
}
</script>
