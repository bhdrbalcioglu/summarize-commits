import { Project } from "./project"; // Adjust the path as necessary

export type OrderByOptions =
  | "name"
  | "path"
  | "created_at"
  | "updated_at"
  | "last_activity_at"; // Define possible order by options

export interface ProjectListState {
  projects: Project[];
  currentPageData: Project[]; // Add this line
  totalPages: number;
  totalProjects: number;
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  orderBy: OrderByOptions; // Use the defined type
  sortOrder: "asc" | "desc";
  isLoading: boolean;
}
