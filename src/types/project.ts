// src/types/project.ts

export interface Project {
  id: number
  name: string
  description: string
  visibility: string
  web_url: string
  last_activity_at: any // Consider using a more specific type if possible
  created_at: string
  star_count: number
  forks_count: number
  default_branch: string
  isLoading: boolean
  namespace: {
    name: string
  }
}
