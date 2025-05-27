// frontend/src/types/commit.ts

export type GitProvider = 'gitlab' | 'github'

export interface CommitAuthor {
  name: string
  email: string
}

export interface Commit {
  id: string
  provider: GitProvider
  short_id: string
  title: string
  message: string
  author: CommitAuthor
  committer?: CommitAuthor
  authored_date: string
  committed_date: string
  web_url: string
  parent_ids?: string[]
  stats?: {
    additions: number
    deletions: number
    total: number
  }
}

export interface Branch {
  provider: GitProvider
  name: string
  is_default: boolean
  is_protected?: boolean
  commit_sha?: string
  web_url?: string
}

export interface CommitDiffFile {
  provider: GitProvider
  old_path?: string
  new_path: string
  a_mode?: string
  b_mode?: string
  diff: string
  is_new_file: boolean
  is_renamed_file: boolean
  is_deleted_file: boolean
}

export interface CommitDetail extends Commit {
  files_changed: CommitDiffFile[]
}

export interface BackendCommitBundleItem {
  provider: GitProvider
  commit_id: string
  author_name: string
  message: string
  files_changed: {
    file_path: string
    diff: string
  }[]
}

export interface CommitListResponse {
  commits: Commit[]
  totalCommits?: number
  isMore?: boolean
  currentPage?: number
  perPage?: number
}
