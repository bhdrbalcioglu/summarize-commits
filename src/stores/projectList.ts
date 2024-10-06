// src/stores/projectList.ts
import { defineStore } from "pinia";
import { Project } from "../types/project";
import { ProjectListState, OrderByOptions } from "../types/projectList";

export const useProjectListStore = defineStore("projectList", {
  state: (): ProjectListState => ({
    projects: [] as Project[],
    currentPageData: [] as Project[],
    totalPages: 1,
    totalProjects: 0,
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: "",
    orderBy: "name" as OrderByOptions,
    sortOrder: "asc",
    isLoading: false,
  }),
  actions: {
    setProjects(projects: Project[]) {
      this.projects = projects;
      this.setCurrentPageData(projects.slice(0, this.itemsPerPage));
    },
    setCurrentPageData(projects: Project[]) {
      this.currentPageData = projects;
    },
    setTotalPages(totalPages: number) {
      this.totalPages = totalPages;
    },
    setTotalProjects(totalProjects: number) {
      this.totalProjects = totalProjects;
    },
    setCurrentPage(page: number) {
      this.currentPage = page;
    },
    setItemsPerPage(itemsPerPage: number) {
      this.itemsPerPage = itemsPerPage;
    },
    setSearchTerm(term: string) {
      this.searchTerm = term;
    },
    setOrderBy(orderBy: OrderByOptions) {
      this.orderBy = orderBy;
    },
    setSortOrder(sortOrder: "asc" | "desc") {
      this.sortOrder = sortOrder;
    },
    setIsLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },
    updateProjectListState(data: Partial<ProjectListState>) {
      Object.assign(this, data);
    },
  },
  getters: {
    getProjects: (state): Project[] => state.projects,
    getTotalPages: (state): number => state.totalPages,
    getTotalProjects: (state): number => state.totalProjects,
    getCurrentPage: (state): number => state.currentPage,
    getItemsPerPage: (state): number => state.itemsPerPage,
    getSearchTerm: (state): string => state.searchTerm,
    getOrderBy: (state): OrderByOptions => state.orderBy,
    getSortOrder: (state): "asc" | "desc" => state.sortOrder,
    getIsLoading: (state): boolean => state.isLoading,
  },
  persist: true,
});
