// src/components/groups/columns.ts

import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import type { Group } from "../../stores/group"; // Adjust the import path as needed
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "../../components/ui/button";

export const columns: ColumnDef<Group>[] = [
  {
    accessorKey: "avatar_url",
    header: "Logo",
    cell: ({ row }) =>
      h("img", {
        src: row.getValue("avatar_url"),
        alt: "Logo",
        class: "w-12 h-12 rounded-full ",
      }),
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "full_name",
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
      h("span", { class: "font-bold text-lg" }, row.getValue("full_name")),
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
];
