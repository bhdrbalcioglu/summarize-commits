import type { ColumnDef } from "@tanstack/vue-table";
import { h, Ref } from "vue";
import type { Commit } from "../../types/commit";
import { ArrowUpDown } from "lucide-vue-next";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FilterFn } from "@tanstack/vue-table";
import AuthorFilterHeader from "./AuthorFilterHeader.vue";

const authorFilterFn: FilterFn<Commit> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) {
    return true; // No filter applied
  }
  const authorName = row.getValue(columnId);
  const result = filterValue.includes(authorName);
  return result;
};

export const columns = (
  selectedAuthors: Ref<string[]>,
  authorsList: Ref<string[]>
): ColumnDef<Commit>[] => [
  {
    id: "select",
    header: ({ table }: { table: any }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        "onUpdate:checked": (value: boolean) =>
          table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
        class: "w-5 h-5",
      }),
    cell: ({ row }: { row: any }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        "onUpdate:checked": (value: boolean) => row.toggleSelected(!!value),
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
    cell: ({ row }: { row: any }) =>
      h("span", { class: "font-mono" }, row.getValue("short_id")),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }: { row: any }) =>
      h(
        "span",
        { class: "truncate max-w-md" },
        row.getValue("title") || "No title"
      ),
  },
  {
    accessorFn: (row) => row.author?.name || "Unknown",
    id: "author_name",
    header: () => {
      return h(AuthorFilterHeader, {
        selectedAuthors: selectedAuthors.value,
        authorsList: authorsList.value,
        "onUpdate:selectedAuthors": (newAuthors: string[]) => {
          selectedAuthors.value = newAuthors;
        },
      });
    },
    cell: ({ row }) => row.getValue("author_name") || "Unknown",
    filterFn: authorFilterFn,
  },
  {
    accessorFn: (row) => row.authored_date,
    id: "authored_date",
    header: ({ column }: { column: any }) => {
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
    cell: ({ row }: { row: any }) => {
      const dateStr = row.getValue("authored_date");
      if (!dateStr) return "Unknown";
      try {
        const date = new Date(dateStr);
        return date.toLocaleString();
      } catch (e) {
        return "Invalid Date";
      }
    },
  },
  {
    accessorKey: "web_url",
    header: "Actions",
    cell: ({ row }: { row: any }) => {
      const commit = row.original as Commit;
      const provider = commit.provider || 'provider';
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      return h(
        "a",
        {
          href: row.getValue("web_url"),
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-blue-600 hover:text-blue-800",
        },
        `View on ${providerName}`
      );
    },
  },
];
