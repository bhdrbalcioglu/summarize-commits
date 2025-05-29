// frontend/src/stores/projectListStore.ts
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
import apiClient from '@/services/apiService';
import type { Project } from '@/types/project';
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage';

// Define OrderByOptions and ProjectListParams (formerly ProjectFetchParams)
// These should align with what your backend expects for its /api/[provider]/projects endpoint.
export type OrderByOptions =
  | 'created_at'
  | 'updated_at'
  | 'last_activity_at'
  | 'name'
  | 'star_count'; // Match backend's ProjectListParams type

export interface ProjectListParams {
  // No provider needed here, it comes from authStore
  groupOrOrgId?: string | number | null; // For GitLab group ID or GitHub org login/ID
  orderBy?: OrderByOptions;
  sort?: 'asc' | 'desc';
  search?: string;
  page?: number;
  perPage?: number;
}

// Structure for the response from your backend's project list endpoints
// (matches backend/src/types/git.types.ts -> ProjectListResponse)
export interface BackendProjectListResponse {
  projects: Project[];
  totalProjects?: number; // Optional as GitHub might not provide it directly
  totalPages?: number;
  currentPage?: number;
  perPage?: number;
}

export interface ProjectListState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null; // Keep as string if IDs from API are strings
  totalPages: number;
  totalProjects: number; // Reflects backend response
  currentPage: number;
  itemsPerPage: number;
  orderBy: OrderByOptions;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  currentGroupId: string | number | null; // Used as groupOrOrgId for backend
  
  // Latest Projects for Dashboard
  latestProjects: Project[];
  isLoadingLatest: boolean;
  latestProjectsError: string | null;
}

export const useProjectListStore = defineStore('projectList', {
  state: (): ProjectListState => ({
    projects: [],
    isLoading: false,
    error: null,
    selectedProjectId: getStorageValue(GLOBAL_KEYS.SELECTED_PROJECT_ID, null),
    totalPages: 0,
    totalProjects: 0,
    currentPage: 1,
    itemsPerPage: 20,
    orderBy: 'last_activity_at', // Default to a common useful sort
    sortOrder: 'desc',
    searchTerm: '',
    currentGroupId: getStorageValue(GLOBAL_KEYS.SELECTED_GROUP_ID, null), // Sync with selected group from groupStore
    latestProjects: [],
    isLoadingLatest: false,
    latestProjectsError: null,
  }),
  getters: {
    selectedProject: (state): Project | null => {
      if (!state.selectedProjectId) return null;
      return state.projects.find((p) => String(p.id) === state.selectedProjectId) || null;
    },
    // This getter constructs the params for the backend API call
    currentFetchParams: (state): ProjectListParams => ({
      groupOrOrgId: state.currentGroupId,
      orderBy: state.orderBy,
      sort: state.sortOrder,
      search: state.searchTerm || undefined,
      page: state.currentPage,
      perPage: state.itemsPerPage,
    }),
    hasProjects: (state): boolean => state.projects.length > 0,
    isLoadingProjects: (state): boolean => state.isLoading,
    projectListError: (state): string | null => state.error,
    
    // Latest Projects Getters
    hasLatestProjects: (state): boolean => state.latestProjects.length > 0,
    isLoadingLatestProjects: (state): boolean => state.isLoadingLatest,
    latestProjectsListError: (state): string | null => state.latestProjectsError,
  },
  actions: {
    setGroupIdCriteria(groupId: string | number | null) {
        if (this.currentGroupId !== (groupId !== null ? String(groupId) : null)) {
            this.currentGroupId = groupId !== null ? String(groupId) : null;
            this.currentPage = 1; // Reset to first page when group changes
            this.projects = []; // Clear projects from the old group
            this.totalProjects = 0;
            this.totalPages = 0;
            // Optionally, persist currentGroupId if needed, though selectedGroupId from groupStore is primary
        }
    },
    setSortAndFilterCriteria(
      criteria: Partial<Pick<ProjectListState, 'orderBy' | 'sortOrder' | 'searchTerm'>>
    ) {
      let needsRefresh = false;
      if (criteria.orderBy !== undefined && this.orderBy !== criteria.orderBy) {
        this.orderBy = criteria.orderBy;
        needsRefresh = true;
      }
      if (criteria.sortOrder !== undefined && this.sortOrder !== criteria.sortOrder) {
        this.sortOrder = criteria.sortOrder;
        needsRefresh = true;
      }
      if (criteria.searchTerm !== undefined && this.searchTerm !== criteria.searchTerm) {
        this.searchTerm = criteria.searchTerm;
        needsRefresh = true;
      }

      if (needsRefresh) {
        this.currentPage = 1; // Reset to first page on sort/filter change
        this.fetchProjects();
      }
    },
    setPagination(pagination: { page?: number; itemsPerPage?: number }) {
      let needsRefresh = false;
      if (pagination.page !== undefined && this.currentPage !== pagination.page) {
        this.currentPage = pagination.page;
        needsRefresh = true;
      }
      if (pagination.itemsPerPage !== undefined && this.itemsPerPage !== pagination.itemsPerPage) {
        this.itemsPerPage = pagination.itemsPerPage;
        needsRefresh = true; // Also reset page if itemsPerPage changes
        this.currentPage = 1;
      }
      if (needsRefresh) {
        this.fetchProjects();
      }
    },

    async fetchProjects() {
      const authStore = useAuthStore();
      if (!authStore.isUserAuthenticated || !authStore.currentProvider) {
        this.error = 'User not authenticated or provider not set to fetch projects.';
        this.projects = [];
        this.isLoading = false;
        return;
      }
      this.isLoading = true;
      this.error = null;

      try {
        const provider = authStore.currentProvider;
        const params = this.currentFetchParams; // Use getter for current params
        const endpoint = `/${provider}/projects`; // e.g., /api/gitlab/projects or /api/github/projects

        const response = await apiClient.get<BackendProjectListResponse>(endpoint, { params });

        this.projects = response.data.projects;
        this.totalPages = response.data.totalPages || 0;
        this.totalProjects = response.data.totalProjects || 0;
        this.currentPage = response.data.currentPage || this.currentPage;
        this.itemsPerPage = response.data.perPage || this.itemsPerPage; // Ensure backend sends this as 'perPage'
      } catch (err: any) {
        const defaultMessage = `Failed to fetch projects for ${authStore.currentProvider}.`;
        this.error = err.response?.data?.message || err.message || defaultMessage;
        console.error(this.error, err);
        this.projects = [];
        this.totalProjects = 0;
        this.totalPages = 0;
      } finally {
        this.isLoading = false;
      }
    },

    selectProject(projectId: string | number | null) {
      const newSelectedId = projectId !== null ? String(projectId) : null;
      this.selectedProjectId = newSelectedId;
      if (newSelectedId) {
        setStorageValue(GLOBAL_KEYS.SELECTED_PROJECT_ID, newSelectedId);
      } else {
        removeStorageValue(GLOBAL_KEYS.SELECTED_PROJECT_ID);
      }
      // Optionally, trigger fetching details for this project if projectStore is separate
      // const projectStore = useProjectStore();
      // if (newSelectedId) projectStore.fetchProjectDetails(newSelectedId);
      // else projectStore.clearProjectDetails();
    },

    // Clears project list and pagination, keeps filters/sorting for potential re-fetch
    clearProjectsAndCriteria() {
      this.projects = [];
      // Do not clear selectedProjectId from localStorage here, user might want to keep it selected across views
      // this.selectedProjectId = null;
      // localStorage.removeItem('selectedProjectId');
      this.error = null;
      this.totalPages = 0;
      this.totalProjects = 0;
      this.currentPage = 1; // Reset to first page
      // Keep: itemsPerPage, orderBy, sortOrder, searchTerm, currentGroupId
    },

    async fetchLatestProjects(limit: number = 3) {
      const authStore = useAuthStore();
      if (!authStore.isUserAuthenticated || !authStore.currentProvider) {
        this.latestProjectsError = 'User not authenticated or provider not set to fetch latest projects.';
        this.latestProjects = [];
        this.isLoadingLatest = false;
        return;
      }
      
      this.isLoadingLatest = true;
      this.latestProjectsError = null;

      try {
        const provider = authStore.currentProvider;
        const params: ProjectListParams = {
          groupOrOrgId: undefined, // Don't filter by group for latest projects
          orderBy: 'last_activity_at',
          sort: 'desc',
          search: undefined,
          page: 1,
          perPage: limit,
        };
        const endpoint = `/${provider}/projects`;

        const response = await apiClient.get<BackendProjectListResponse>(endpoint, { params });

        this.latestProjects = response.data.projects;
      } catch (err: any) {
        const defaultMessage = `Failed to fetch latest projects for ${authStore.currentProvider}.`;
        this.latestProjectsError = err.response?.data?.message || err.message || defaultMessage;
        console.error(this.latestProjectsError, err);
        this.latestProjects = [];
      } finally {
        this.isLoadingLatest = false;
      }
    },

    // Full reset of the store, e.g., on logout or provider change
    resetProjectListState() {
      this.projects = [];
      this.isLoading = false;
      this.error = null;
      this.selectedProjectId = null;
      removeStorageValue(GLOBAL_KEYS.SELECTED_PROJECT_ID);
      this.totalPages = 0;
      this.totalProjects = 0;
      this.currentPage = 1;
      this.itemsPerPage = 20;
      this.orderBy = 'last_activity_at';
      this.sortOrder = 'desc';
      this.searchTerm = '';
      this.currentGroupId = null;
      
      // Reset latest projects state
      this.latestProjects = [];
      this.isLoadingLatest = false;
      this.latestProjectsError = null;
      // No need to remove 'selectedGroupId' from localStorage here, as groupStore handles its own
    },
  },
});