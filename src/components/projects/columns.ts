import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import type { Project } from "../../types/project";
import { ArrowUpDown } from "lucide-vue-next";
import { Button } from "../../components/ui/button";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          class: "flex items-center",
        },
        () => ["Name", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) =>
      h("span", { class: "font-semibold" }, row.getValue("name")),
  },
  {
    accessorKey: "namespace.name",
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          class: "flex items-center",
        },
        () => ["Group", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => row.original.namespace?.name || "N/A",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) =>
      h(
        "span",
        { class: "truncate max-w-md" },
        row.getValue("description") || "No description"
      ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const visibility = row.getValue("visibility");
      if (visibility === "public") {
        return h("i", { class: "fa-solid fa-eye" });
      } else if (visibility === "private") {
        return h("i", { class: "fa-solid fa-lock" });
      } else {
        return "Unknown";
      }
    },
  },
  {
    accessorKey: "last_activity_at",
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          class: "flex items-center",
        },
        () => ["Last Activity", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("last_activity_at"));
      return date.toLocaleString();
    },
  },
];
