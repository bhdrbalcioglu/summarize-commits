export type GitProvider = 'gitlab' | 'github' 
export interface ProjectNamespace {
  id: string | number
  name: string
  path: string
  kind: 'user' | 'group' | 'organization'
  avatar_url?: string
}

export interface ProjectLicense {
  key: string
  name: string
  spdx_id?: string
  nickname?: string
  url?: string
  html_url?: string
}

export interface ProjectStatistics {
  commit_count?: number
  storage_size?: number
  repository_size?: number
  lfs_objects_size?: number
  job_artifacts_size?: number
}

export interface Project {
  id: string | number
  provider: GitProvider
  name: string
  path_with_namespace: string
  description: string | null
  web_url: string
  default_branch: string | null
  namespace: ProjectNamespace
  last_activity_at: string | null
  visibility?: 'public' | 'internal' | 'private' | string 
  created_at?: string 
  star_count?: number 
  forks_count?: number 
  
  // Enhanced fields for Phase 1
  license?: ProjectLicense | null
  language?: string | null
  size?: number // Repository size in KB
  topics?: string[]
  open_issues_count?: number
  watchers_count?: number
  homepage?: string | null
  archived?: boolean
  statistics?: ProjectStatistics | null
  avatar_url?: string | null
  readme_url?: string | null
}
