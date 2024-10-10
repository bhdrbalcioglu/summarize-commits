<template>
  <div class="border rounded-md">
    <Table>
      <!-- Table Header -->
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <div v-if="!header.isPlaceholder">
              <FlexRender
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <!-- Table Body -->
      <TableBody>
        <template v-if="table.getFilteredRowModel().rows.length">
          <TableRow
            v-for="row in table.getFilteredRowModel().rows"
            :key="row.id"
            @click="handleRowClick(row)"
            class="cursor-pointer hover:bg-gray-100"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { OrderByOptions } from "../../types/projectList";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/vue-table";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../components/ui/table";
import { FlexRender } from "@tanstack/vue-table";
import type { Project } from "../../types/project";
import { columns } from "./columns";
import { useProjectListStore } from "../../stores/projectList";
import { storeToRefs } from "pinia";

const emit = defineEmits<{
  (e: "rowClick", rowData: Project): void;
}>();

const projectListStore = useProjectListStore();
const { projects, orderBy, sortOrder } = storeToRefs(projectListStore);

const sorting = computed({
  get: () => [{ id: orderBy.value, desc: sortOrder.value === "desc" }],
  set: (value) => {
    if (value.length > 0) {
      projectListStore.setOrderBy(value[0].id as any);
      projectListStore.setSortOrder(value[0].desc ? "desc" : "asc");
    }
  },
});

const table = useVueTable<Project>({
  get data() {
    return projects.value;
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      sorting.value = updaterOrValue(sorting.value) as {
        id: OrderByOptions;
        desc: boolean;
      }[];
    } else {
      sorting.value = updaterOrValue as { id: OrderByOptions; desc: boolean }[];
    }
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
});

function handleRowClick(row: any) {
  emit("rowClick", row.original);
}
</script>
