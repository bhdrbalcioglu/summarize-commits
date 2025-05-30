// backend/src/services/gitlabService.ts
import axios, { AxiosError } from "axios";
import { URLSearchParams } from "url"; // For exchanging code
import { environment } from "../config/index.js";
import {
  GitProvider, // The literal type 'gitlab' | 'github'
  User, // Our common User interface
  Project, // Our common Project interface
  ProjectListParams, // Params for listing projects (your backend API will define these)
  ProjectListResponse, // Response for listing projects (from your backend API)
  Group, // Our common Group interface
  Branch, // Our common Branch interface
  Commit, // Our common Commit interface
  CommitDetail, // Our common CommitDetail interface (Commit + files_changed)
  CommitDiffFile, // Our common CommitDiffFile interface
  BackendCommitBundleItem, // Our common BackendCommitBundleItem interface
  RepositoryTreeItem, // Our common RepositoryTreeItem interface
  OAuthUserProfile, // The generic profile from provider
} from "../types/index.js"; // Assuming all types are exported via barrel file

const gitlabAPI = axios.create({
  baseURL: "https://gitlab.com/api/v4",
});

// Helper to add Authorization header
const getAuthConfig = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

// --- Authentication Related (called by authController) ---

export const exchangeCodeForGitLabToken = async (
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  idToken?: string; // GitLab provides id_token if openid scope is used
  expiresIn: number;
  createdAt: number;
  scope: string;
  tokenType: string;
}> => {
  try {
    const params = new URLSearchParams({
      client_id: environment.gitlab.clientId,
      client_secret: environment.gitlab.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: environment.gitlab.redirectUri,
    });
    const response = await axios.post(
      "https://gitlab.com/oauth/token",
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      idToken: response.data.id_token,
      expiresIn: response.data.expires_in, // in seconds
      createdAt: response.data.created_at, // Unix timestamp
      scope: response.data.scope,
      tokenType: response.data.token_type,
    };
  } catch (error: any) {
    console.error(
      "GitLab Service: Error exchanging code for token:",
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab token exchange failed: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
};

export const getGitLabUserProfile = async (
  accessToken: string
): Promise<OAuthUserProfile> => {
  try {
    const { data: glUser } = await gitlabAPI.get(
      "/user",
      getAuthConfig(accessToken)
    );
    // Map raw GitLab user to our common OAuthUserProfile
    return {
      id: glUser.id,
      username: glUser.username,
      name: glUser.name,
      email: glUser.email, // GitLab provides email if scopes allow
      avatar_url: glUser.avatar_url,
      web_url: glUser.web_url,

      // Enhanced fields
      bio: glUser.bio || null,
      location: glUser.location || null,
      organization: glUser.organization || null,
      website_url: glUser.website_url || null,
      twitter: glUser.twitter || null,
      linkedin: glUser.linkedin || null,
      discord: glUser.discord || null,
      public_email: glUser.public_email || null,
      skype: glUser.skype || null,
      job_title: glUser.job_title || null,
      pronouns: glUser.pronouns || null,
      bot: glUser.bot || false,
      created_at: glUser.created_at,
      last_activity_on: glUser.last_activity_on,
      last_sign_in_at: glUser.last_sign_in_at,
      current_sign_in_at: glUser.current_sign_in_at,
      confirmed_at: glUser.confirmed_at,
      theme_id: glUser.theme_id,
      color_scheme_id: glUser.color_scheme_id,
    };
  } catch (error: any) {
    console.error(
      "GitLab Service: Error fetching user profile:",
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab user profile fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

// --- Data Fetching Functions (called by gitlabController) ---

// Corresponds to your old BackendProjectFetchParams and ProjectListParams
interface GitLabProjectApiParams {
  membership?: boolean;
  order_by?:
    | "created_at"
    | "updated_at"
    | "last_activity_at"
    | "name"
    | "similarity"
    | "stars"; // GitLab specific
  sort?: "asc" | "desc";
  search?: string;
  per_page?: number;
  page?: number;
  // Other GitLab specific params like statistics, with_issues_enabled etc. can be added
  statistics?: boolean; // To get star_count, forks_count
}

export const fetchProjectsFromGitLab = async (
  accessToken: string,
  params: ProjectListParams // Use our common params type
): Promise<ProjectListResponse> => {
  const { groupOrOrgId, orderBy, sort, search, page, perPage } = params;
  const url = groupOrOrgId ? `/groups/${groupOrOrgId}/projects` : "/projects";

  const apiParams: GitLabProjectApiParams = {
    membership: true, // Typically fetch projects user is a member of
    order_by: orderBy === "star_count" ? "stars" : orderBy, // Map 'star_count' to 'stars' for GitLab
    sort,
    search,
    page,
    per_page: perPage,
    statistics: true, // Needed for star_count, forks_count
  };

  try {
    const response = await gitlabAPI.get(url, {
      ...getAuthConfig(accessToken),
      params: apiParams,
    });

    const projects: Project[] = response.data.map(
      (glProject: any): Project => ({
        id: glProject.id,
        provider: "gitlab",
        name: glProject.name,
        path_with_namespace: glProject.path_with_namespace,
        description: glProject.description || null,
        web_url: glProject.web_url,
        default_branch: glProject.default_branch || null,
        namespace: {
          id: glProject.namespace.id,
          name: glProject.namespace.name,
          path: glProject.namespace.path,
          kind: glProject.namespace.kind, // 'group' or 'user'
          avatar_url: glProject.namespace.avatar_url || undefined,
        },
        star_count: glProject.star_count,
        forks_count: glProject.forks_count,
        last_activity_at: glProject.last_activity_at,
        created_at: glProject.created_at,
        visibility: glProject.visibility,

        // Enhanced fields for Phase 1
        license: glProject.license
          ? {
              key: glProject.license.key,
              name: glProject.license.name,
              nickname: glProject.license.nickname,
              html_url: glProject.license.html_url,
            }
          : null,
        language: null, // GitLab doesn't provide primary language in project listing
        size: glProject.statistics?.repository_size || 0,
        topics: glProject.topics || [],
        open_issues_count: glProject.open_issues_count || 0,
        watchers_count: undefined, // GitLab doesn't have watchers concept like GitHub
        homepage: glProject.homepage || null,
        archived: glProject.archived || false,
        avatar_url: glProject.avatar_url || null,
        readme_url: glProject.readme_url || null,
        statistics: glProject.statistics
          ? {
              commit_count: glProject.statistics.commit_count,
              storage_size: glProject.statistics.storage_size,
              repository_size: glProject.statistics.repository_size,
              lfs_objects_size: glProject.statistics.lfs_objects_size,
              job_artifacts_size: glProject.statistics.job_artifacts_size,
            }
          : null,
      })
    );

    return {
      projects,
      totalProjects: parseInt(response.headers["x-total"] || "0"),
      totalPages: parseInt(response.headers["x-total-pages"] || "1"),
      currentPage: parseInt(response.headers["x-page"] || String(page || "1")),
      perPage: parseInt(
        response.headers["x-per-page"] || String(perPage || "20")
      ),
    };
  } catch (error: any) {
    console.error(
      "GitLab Service: Error fetching projects:",
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab projects fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const fetchProjectDetailsFromGitLab = async (
  accessToken: string,
  projectId: string | number
): Promise<Project> => {
  try {
    const { data: glProject } = await gitlabAPI.get(`/projects/${projectId}`, {
      ...getAuthConfig(accessToken),
      params: { statistics: true }, // Ensure stats are included
    });
    return {
      id: glProject.id,
      provider: "gitlab",
      name: glProject.name,
      path_with_namespace: glProject.path_with_namespace,
      description: glProject.description || null,
      web_url: glProject.web_url,
      default_branch: glProject.default_branch || null,
      namespace: {
        id: glProject.namespace.id,
        name: glProject.namespace.name,
        path: glProject.namespace.path,
        kind: glProject.namespace.kind,
        avatar_url: glProject.namespace.avatar_url || undefined,
      },
      star_count: glProject.star_count,
      forks_count: glProject.forks_count,
      last_activity_at: glProject.last_activity_at,
      created_at: glProject.created_at,
      visibility: glProject.visibility,

      // Enhanced fields for Phase 1
      license: glProject.license
        ? {
            key: glProject.license.key,
            name: glProject.license.name,
            nickname: glProject.license.nickname,
            html_url: glProject.license.html_url,
          }
        : null,
      language: null, // GitLab doesn't provide primary language in project endpoint
      size: glProject.statistics?.repository_size || 0,
      topics: glProject.topics || [],
      open_issues_count: glProject.open_issues_count || 0,
      watchers_count: undefined, // GitLab doesn't have watchers concept like GitHub
      homepage: glProject.homepage || null,
      archived: glProject.archived || false,
      avatar_url: glProject.avatar_url || null,
      readme_url: glProject.readme_url || null,
      statistics: glProject.statistics
        ? {
            commit_count: glProject.statistics.commit_count,
            storage_size: glProject.statistics.storage_size,
            repository_size: glProject.statistics.repository_size,
            lfs_objects_size: glProject.statistics.lfs_objects_size,
            job_artifacts_size: glProject.statistics.job_artifacts_size,
          }
        : null,
    };
  } catch (error: any) {
    console.error(
      `GitLab Service: Error fetching project details for ${projectId}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab project details fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const fetchBranchesFromGitLab = async (
  accessToken: string,
  projectId: string | number
): Promise<Branch[]> => {
  try {
    const response = await gitlabAPI.get(
      `/projects/${projectId}/repository/branches`,
      getAuthConfig(accessToken)
    );
    return response.data.map(
      (glBranch: any): Branch => ({
        provider: "gitlab",
        name: glBranch.name,
        is_default: glBranch.default,
        is_protected: glBranch.protected,
        commit_sha: glBranch.commit?.id, // GitLab branch commit object has an 'id' field for SHA
        web_url: glBranch.web_url,
      })
    );
  } catch (error: any) {
    console.error(
      `GitLab Service: Error fetching branches for ${projectId}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab branches fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

// Params for fetching commits from your backend API (used by controller to pass to this service)
interface GitLabCommitsApiParams {
  ref_name?: string; // Branch or tag name
  since?: string; // ISO 8601 format date
  until?: string; // ISO 8601 format date
  page?: number;
  per_page?: number;
  // Other GitLab params like 'path', 'author', 'stats', 'with_stats'
  with_stats?: boolean; // To get additions/deletions
}
// Response structure for a list of commits from your backend API
export interface CommitListResponse {
  commits: Commit[];
  totalCommits?: number; // If available from headers or other means
  isMore?: boolean; // If there are more pages
  currentPage?: number;
}

export const fetchCommitsFromGitLab = async (
  accessToken: string,
  projectId: string | number,
  params: {
    // Parameters specific to fetching commits
    branch?: string;
    page?: number;
    perPage?: number;
    since?: string | null;
    until?: string | null;
  }
): Promise<CommitListResponse> => {
  const { branch, page, perPage, since, until } = params;
  const apiParams: GitLabCommitsApiParams = {
    ref_name: branch,
    page,
    per_page: perPage,
    since: since || undefined,
    until: until || undefined,
    with_stats: true, // To get additions/deletions stats
  };

  try {
    const response = await gitlabAPI.get(
      `/projects/${projectId}/repository/commits`,
      {
        ...getAuthConfig(accessToken),
        params: apiParams,
      }
    );

    const commits: Commit[] = response.data.map(
      (glCommit: any): Commit => ({
        id: glCommit.id,
        provider: "gitlab",
        short_id: glCommit.short_id,
        title: glCommit.title,
        message: glCommit.message,
        author: {
          name: glCommit.author_name,
          email: glCommit.author_email,
        },
        committer: {
          // GitLab provides separate committer info
          name: glCommit.committer_name,
          email: glCommit.committer_email,
        },
        authored_date: glCommit.authored_date,
        committed_date: glCommit.committed_date,
        web_url: glCommit.web_url,
        parent_ids: glCommit.parent_ids,
        stats: glCommit.stats
          ? {
              // Map stats if 'with_stats=true' was used
              additions: glCommit.stats.additions,
              deletions: glCommit.stats.deletions,
              total: glCommit.stats.total,
            }
          : undefined,
      })
    );

    const totalCommits = parseInt(
      response.headers["x-total"] || String(commits.length)
    ); // Fallback to current length if header missing
    const nextPageHeader = response.headers["x-next-page"];
    const isMore = nextPageHeader
      ? parseInt(nextPageHeader) > 0
      : commits.length === perPage && commits.length < totalCommits;

    return { commits, totalCommits, isMore, currentPage: page };
  } catch (error: any) {
    console.error(
      `GitLab Service: Error fetching commits for project ${projectId}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab commits fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getCommitDetailsAndDiffsFromGitLab = async (
  accessToken: string,
  projectId: string | number,
  commitSha: string
): Promise<CommitDetail> => {
  try {
    // GitLab's single commit endpoint can include stats and diff
    const { data: glCommit } = await gitlabAPI.get(
      `/projects/${projectId}/repository/commits/${commitSha}?stats=true&diff=true`,
      getAuthConfig(accessToken)
    );
    // Note: GitLab API for single commit diff is `GET /projects/:id/repository/commits/:sha/diff`
    // but the commit details endpoint often includes enough info if `diff=true` is supported or by fetching diff separately.
    // For more robust diffs, a separate call to /diff might be better.
    // The current code assumes glCommit object after ?diff=true might have a 'diff' array or similar.
    // GitLab's API usually provides diffs in a separate endpoint. Let's fetch diffs separately for accuracy.

    const diffResponse = await gitlabAPI.get(
      `/projects/${projectId}/repository/commits/${commitSha}/diff`,
      getAuthConfig(accessToken)
    );

    const files_changed: CommitDiffFile[] = diffResponse.data.map(
      (glDiff: any): CommitDiffFile => ({
        provider: "gitlab",
        old_path: glDiff.old_path,
        new_path: glDiff.new_path,
        diff: glDiff.diff,
        is_new_file: glDiff.new_file,
        is_renamed_file: glDiff.renamed_file,
        is_deleted_file: glDiff.deleted_file,
        a_mode: glDiff.a_mode,
        b_mode: glDiff.b_mode,
      })
    );

    return {
      id: glCommit.id,
      provider: "gitlab",
      short_id: glCommit.short_id,
      title: glCommit.title,
      message: glCommit.message,
      author: { name: glCommit.author_name, email: glCommit.author_email },
      committer: {
        name: glCommit.committer_name,
        email: glCommit.committer_email,
      },
      authored_date: glCommit.authored_date,
      committed_date: glCommit.committed_date,
      web_url: glCommit.web_url,
      parent_ids: glCommit.parent_ids,
      stats: glCommit.stats
        ? {
            additions: glCommit.stats.additions,
            deletions: glCommit.stats.deletions,
            total: glCommit.stats.total,
          }
        : undefined,
      files_changed, // From the separate /diff call
    };
  } catch (error: any) {
    console.error(
      `GitLab Service: Error fetching commit details for ${commitSha}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab commit details fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getCommitsBundleForAIFromGitLab = async (
  accessToken: string,
  projectId: string | number,
  commitIds: string[]
): Promise<BackendCommitBundleItem[]> => {
  try {
    const bundles: BackendCommitBundleItem[] = await Promise.all(
      commitIds.map(async (commitId) => {
        // Fetch full commit details which includes diffs
        const detailedCommit = await getCommitDetailsAndDiffsFromGitLab(
          accessToken,
          projectId,
          commitId
        );

        return {
          provider: "gitlab",
          commit_id: detailedCommit.id,
          author_name: detailedCommit.author.name,
          message: detailedCommit.message,
          files_changed: detailedCommit.files_changed.map((fc) => ({
            file_path: fc.new_path, // or handle old_path for renames if necessary
            diff: fc.diff,
          })),
        };
      })
    );
    return bundles;
  } catch (error: any) {
    console.error(
      `GitLab Service: Error fetching commit bundles for project ${projectId}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab commit bundles fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getUserGroupsFromGitLab = async (
  accessToken: string
): Promise<Group[]> => {
  try {
    const response = await gitlabAPI.get("/groups", {
      ...getAuthConfig(accessToken),
      params: { min_access_level: 20, per_page: 100, simple: true }, // simple=true for less data if sufficient
    });
    return response.data.map(
      (glGroup: any): Group => ({
        id: glGroup.id,
        provider: "gitlab",
        name: glGroup.name,
        path: glGroup.path, // GitLab 'path' is usually just the last segment, full_path is the one with parent groups
        // full_path: glGroup.full_path, // If needed by your Group type
        description: glGroup.description || null,
        web_url: glGroup.web_url,
        avatar_url: glGroup.avatar_url || null,
      })
    );
  } catch (error: any) {
    console.error(
      "GitLab Service: Error fetching user groups:",
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab user groups fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getProjectFileTreeFromGitLab = async (
  accessToken: string,
  projectId: string | number,
  path: string = "",
  ref: string = "main" // branch, tag, or commit
): Promise<RepositoryTreeItem[]> => {
  try {
    const response = await gitlabAPI.get(
      `/projects/${projectId}/repository/tree`,
      {
        ...getAuthConfig(accessToken),
        params: { path, ref, recursive: false, per_page: 100 }, // recursive=false for one level, true for all
      }
    );
    return response.data.map(
      (item: any): RepositoryTreeItem => ({
        id: item.id, // SHA
        provider: "gitlab",
        name: item.name,
        path: item.path,
        type: item.type as "tree" | "blob", // GitLab uses 'tree' or 'blob'
        mode: item.mode,
      })
    );
  } catch (error: any) {
    console.error(
      "GitLab Service: Error fetching project file tree:",
      error.response?.data || error.message
    );
    throw new Error(
      `GitLab file tree fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getFileContentFromGitLab = async (
  accessToken: string,
  projectId: string | number,
  filePath: string,
  ref: string // branch, tag, or commit
): Promise<string> => {
  try {
    const response = await gitlabAPI.get(
      `/projects/${projectId}/repository/files/${encodeURIComponent(
        filePath
      )}/raw`,
      {
        ...getAuthConfig(accessToken),
        params: { ref },
        responseType: "text", // Expect raw text content
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "GitLab Service: Error fetching file content:",
      error.response?.data || error.message
    );
    // Check for 404 if file not found and throw a specific error
    if ((error as AxiosError).response?.status === 404) {
      throw new Error(
        `File not found in GitLab project: ${filePath} at ref ${ref}`
      );
    }
    throw new Error(
      `GitLab file content fetch failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};
