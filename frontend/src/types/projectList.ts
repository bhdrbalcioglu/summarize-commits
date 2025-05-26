import { Project } from './project' // Adjust the path as necessary

export const OrderByOptions = {
  ID: 'id',
  NAME: 'name',
  PATH: 'path',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  STAR_COUNT: 'star_count',
  LAST_ACTIVITY_AT: 'last_activity_at'
} as const

export type OrderByOptions = (typeof OrderByOptions)[keyof typeof OrderByOptions]

export const DEFAULT_ORDER_BY: OrderByOptions = 'created_at'

export interface ProjectListState {
  projects: Project[]
  currentPageData: Project[] // Add this line
  totalPages: number
  totalProjects: number
  currentPage: number
  itemsPerPage: number
  searchTerm: string
  orderBy: OrderByOptions // Use the defined type
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
}
