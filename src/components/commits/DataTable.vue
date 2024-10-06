<template>
  <div class="border rounded-md">
    <Table>
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
      <TableBody>
        <template v-if="table.getRowModel().rows.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :class="{
              'bg-blue-100 border-l-4 border-blue-500 shadow-md':
                row.getIsSelected(),

              'transition-all duration-100 ease-in-out': true,
            }"
            class="border-b border-gray-200"
          >
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :class="{
                'font-medium': row.getIsSelected(),
              }"
            >
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
import { ref, watch, computed } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import type { Commit } from "../../types/commit";
import { columns } from "./columns";

const props = defineProps<{
  commits: Commit[];
  selectedCommits: string[];
}>();

const emit = defineEmits<{
  (e: "toggleSelection", commitId: string): void;
}>();

const sorting = ref([{ id: "created_at", desc: true }]);
const rowSelection = ref({});

const selectedCommitIds = computed(() =>
  Object.entries(rowSelection.value)
    .filter(([_, selected]) => selected)
    .map(([index]) => props.commits[parseInt(index)].id)
);

const table = useVueTable({
  get data() {
    return props.commits;
  },
  columns,
  state: {
    get sorting() {
      return sorting.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting.value)
        : updaterOrValue;
  },
  onRowSelectionChange: (updaterOrValue) => {
    const newSelection: Record<number, boolean> =
      typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection.value as Record<number, boolean>)
        : updaterOrValue;

    // Find the changed row
    const changedIndex = Object.keys(newSelection).find((index) => {
      const numIndex = Number(index);
      return (
        newSelection[numIndex as keyof typeof newSelection] !==
        rowSelection.value[numIndex as keyof typeof rowSelection.value]
      );
    });

    if (changedIndex !== undefined) {
      const commitId = props.commits[Number(changedIndex)].id;
      emit("toggleSelection", commitId);
    }

    rowSelection.value = newSelection;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

// Sync rowSelection with selectedCommits prop
watch(
  () => props.selectedCommits,
  (newSelectedCommits) => {
    rowSelection.value = props.commits.reduce((acc, commit, index) => {
      acc[index] = newSelectedCommits.includes(commit.id);
      return acc;
    }, {} as Record<number, boolean>);
  },
  { immediate: true }
);

// Sync selectedCommits with rowSelection
watch(selectedCommitIds, (newSelectedIds) => {
  const addedIds = newSelectedIds.filter(
    (id) => !props.selectedCommits.includes(id)
  );
  const removedIds = props.selectedCommits.filter(
    (id) => !newSelectedIds.includes(id)
  );

  addedIds.forEach((id) => emit("toggleSelection", id));
  removedIds.forEach((id) => emit("toggleSelection", id));
});
</script>
