// frontend/src/types/projectList.ts
import type { Project } from './project' // Assuming this path is correct and Project is aligned
import type { GitProvider } from './commit' // Or wherever GitProvider is defined in frontend types


export const PROJECT_ORDER_BY_OPTIONS = {
  // Using backend field names where possible for clarity when constructing params
  LAST_ACTIVITY_AT: 'last_activity_at',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  NAME: 'name',
  STAR_COUNT: 'star_count'
  // ID: 'id', // Less common to sort by raw ID in UI
  // PATH: 'path', // Less common to sort by path in UI
} as const

export type ProjectOrderByOptions = (typeof PROJECT_ORDER_BY_OPTIONS)[keyof typeof PROJECT_ORDER_BY_OPTIONS]

export const DEFAULT_PROJECT_ORDER_BY: ProjectOrderByOptions = 'last_activity_at'

export interface FrontendProjectListParams {
  groupOrOrgId?: string | number | null // Matches backend's ProjectListParams
  orderBy?: ProjectOrderByOptions // Matches backend's ProjectListParams
  sort?: 'asc' | 'desc' // Matches backend's ProjectListParams
  search?: string // Matches backend's ProjectListParams
  page?: number // Matches backend's ProjectListParams
  perPage?: number // Matches backend's ProjectListParams
}

// Replaces GitLabTreeItem, aligns with backend's RepositoryTreeItem
export interface RepositoryTreeItem {
  id: string // SHA or unique ID from provider
  provider: GitProvider // Added
  name: string
  path: string
  type: 'tree' | 'blob' | 'commit' // 'commit' for submodules
  mode?: string // File mode (optional as backend's is optional)
}

export interface ProjectListStoreState {
  projects: Project[]
  isLoading: boolean
  error: string | null

  totalPages: number
  totalProjects: number // Reflects backend's totalProjects
  currentPage: number

  // Criteria for fetching projects, managed by the store's state
  itemsPerPage: number
  orderBy: ProjectOrderByOptions
  sortOrder: 'asc' | 'desc'
  searchTerm: string
  currentGroupId: string | number | null // To filter projects by group/org
}

export interface BackendProjectListResponse {
  projects: Project[]
  totalProjects?: number
  totalPages?: number
  currentPage?: number
  perPage?: number
}
