import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import type { Commit } from "../../types/commit";
import { ArrowUpDown } from "lucide-vue-next";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";

export const columns: ColumnDef<Commit>[] = [
  {
    id: "select",
    header: ({ table }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        "onUpdate:checked": (value) => table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
        class: "w-5 h-5",
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        "onUpdate:checked": (value) => row.toggleSelected(!!value),
        "aria-label": "Select row",
        class: "w-5 h-5 transition-all duration-200 ease-in-out",
        style: row.getIsSelected()
          ? "transform: scale(1.2); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);"
          : "",
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "short_id",
    header: "ID",
    cell: ({ row }) =>
      h("span", { class: "font-mono" }, row.getValue("short_id")),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) =>
      h(
        "span",
        { class: "truncate max-w-md" },
        row.getValue("title") || "No title"
      ),
  },
  {
    accessorKey: "author_name",
    header: "Author",
    cell: ({ row }) => row.getValue("author_name"),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          class: "flex items-center",
        },
        () => ["Date", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleString();
    },
  },
  {
    accessorKey: "web_url",
    header: "Actions",
    cell: ({ row }) =>
      h(
        "a",
        {
          href: row.getValue("web_url"),
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-blue-600 hover:text-blue-800",
        },
        "View on GitLab"
      ),
  },
];
