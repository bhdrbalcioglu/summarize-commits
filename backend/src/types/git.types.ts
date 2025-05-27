// backend/src/types/git.types.ts

export type GitProvider = "gitlab" | "github";

export interface User {
  id: string | number; // Provider's user ID
  provider: GitProvider;
  username: string; // Login name from provider
  name: string; // Display name
  avatar_url: string;
  web_url?: string; // Link to user's profile on the provider
  email?: string | null; // May not always be available or public
}

export interface ProjectNamespace {
  // Represents the owner/group of a project
  id: string | number;
  name: string; // Name of the group or user owner
  path: string; // Full path for GitLab groups, or login for GitHub owners
  kind: "user" | "group" | "organization"; // To distinguish owner type
  avatar_url?: string;
}

export interface Project {
  id: string | number; // Provider's project/repository ID
  provider: GitProvider;
  name: string; // Project/repository name
  path_with_namespace: string; // e.g., "group/project-name" or "owner/repo-name"
  description: string | null;
  web_url: string;
  default_branch: string | null;
  namespace: ProjectNamespace;
  star_count?: number;
  forks_count?: number;
  last_activity_at?: string | null; // ISO Date string
  created_at?: string; // ISO Date string
  visibility?: "public" | "internal" | "private"; // More common in GitLab, GitHub is mainly public/private
  // topics?: string[]; // Tags/keywords
}

// For listing projects, parameters your backend API might accept
// This replaces ProjectFetchParams and ProjectListState from your old files for backend use.
export interface ProjectListParams {
  provider: GitProvider;
  userId?: string | number; // If fetching for a specific user (e.g., their memberships)
  groupOrOrgId?: string | number; // GitLab group ID or GitHub org login/ID
  groupOrOrgName?: string; // For display or if ID is not primary lookup
  orderBy?:
    | "created_at"
    | "updated_at"
    | "last_activity_at"
    | "name"
    | "star_count"; // Keep relevant ones
  sort?: "asc" | "desc";
  search?: string;
  page?: number;
  perPage?: number;
  // Add other common filters if needed, e.g., archived status
}

// Response structure for a list of projects from your backend API
export interface ProjectListResponse {
  projects: Project[];
  totalProjects?: number;
  totalPages?: number;
  currentPage?: number;
  perPage?: number;
}

export interface Group {
  // For GitLab groups or GitHub organizations
  id: string | number;
  provider: GitProvider;
  name: string; // GitLab group name or GitHub organization login
  path: string; // GitLab full_path or GitHub org login
  description: string | null;
  web_url: string;
  avatar_url: string | null;
  // parent_id?: string | number | null; // For GitLab subgroups
}

export interface CommitAuthor {
  name: string;
  email: string;
  // date?: string; // ISO Date for authored_date, often part of Commit itself
}

export interface Commit {
  id: string; // SHA
  provider: GitProvider;
  short_id: string; // First 7-10 chars of SHA
  title: string; // First line of commit message
  message: string; // Full commit message
  author: CommitAuthor; // Person who originally wrote the code
  committer?: CommitAuthor; // Person who committed the code (can be different)
  authored_date: string; // ISO Date string
  committed_date: string; // ISO Date string
  web_url: string;
  parent_ids?: string[];
  stats?: {
    // Optional: lines added/deleted/total
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface CommitDiffFile {
  provider: GitProvider;
  old_path?: string;
  new_path: string;
  diff: string; // The actual patch text
  is_new_file: boolean;
  is_renamed_file: boolean;
  is_deleted_file: boolean;
  a_mode?: string;
  b_mode?: string;
  // additions?: number; // If your diff parsing provides this
  // deletions?: number; // If your diff parsing provides this
}

// For fetching detailed information of a single commit, including file diffs
export interface CommitDetail extends Commit {
  files_changed: CommitDiffFile[];
}

// Structure specifically for sending to the AI for analysis.
// This reuses your `CommitBundle` structure, adding the provider.
export interface BackendCommitBundleItem {
  provider: GitProvider;
  commit_id: string; // Matches Commit.id
  author_name: string;
  message: string;
  files_changed: {
    // Simplified diff information
    file_path: string;
    diff: string; // The actual patch/diff string
  }[];
}

export interface Branch {
  provider: GitProvider;
  name: string;
  is_default: boolean;
  is_protected?: boolean;
  commit_sha?: string; // SHA of the latest commit on this branch
  web_url?: string; // URL to the branch page on the provider
}

// For file tree browsing (GitLabTreeItem concept)
export interface RepositoryTreeItem {
  id: string; // SHA or unique ID from provider
  provider: GitProvider;
  name: string;
  path: string;
  type: "tree" | "blob" | "commit"; // 'commit' for submodules
  mode?: string; // File mode
  // size?: number; // For blobs
  // url?: string; // API URL for this item
}

export interface CommitListResponse {
  commits: Commit[];
  totalCommits?: number; // Total number of commits (if known, GitHub often doesn't provide this for list endpoints)
  isMore?: boolean; // Indicates if there are more pages of commits to fetch
  currentPage?: number; // The current page number that was fetched
  perPage?: number; // The number of commits per page requested (optional, but good for consistency)
}
