export type GitProvider = 'gitlab' | 'github' 
export interface ProjectNamespace {
  id: string | number
  name: string
  path: string
  kind: 'user' | 'group' | 'organization'
  avatar_url?: string
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
}
