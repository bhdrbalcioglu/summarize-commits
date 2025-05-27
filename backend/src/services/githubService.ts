// backend/src/services/githubService.ts
import axios, { AxiosRequestConfig, AxiosError } from "axios";
// URLSearchParams might not be needed for GitHub token exchange as it uses JSON body.
// import { URLSearchParams } from "url";
import { environment } from "../config/index.js";
import {
  GitProvider,
  User,
  Project,
  ProjectListParams,
  ProjectListResponse,
  Group,
  Branch,
  Commit,
  CommitAuthor,
  CommitDetail,
  CommitDiffFile,
  BackendCommitBundleItem,
  RepositoryTreeItem,
  OAuthUserProfile,
  CommitListResponse, // Renaming to avoid conflict if any
} from "../types/index.js";

const GITHUB_API_VERSION = "2022-11-28";

const githubAPI = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  },
});

// Helper to add Authorization header
const getAuthConfig = (accessToken: string): AxiosRequestConfig => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Helper Function (parseLinkHeader)
const parseLinkHeader = (
  linkHeader: string | string[] | undefined | null
): { [key: string]: string } => {
  const links: { [key: string]: string } = {};
  if (!linkHeader) {
    return links;
  }

  const header = Array.isArray(linkHeader) ? linkHeader.join(", ") : linkHeader;
  const parts = header.split(",");

  parts.forEach((part) => {
    const section = part.split(";");
    if (section.length < 2) {
      return;
    }

    const urlMatch = section[0].match(/<(.*)>/);
    if (!urlMatch) {
      return;
    }
    const url = urlMatch[1];

    const relMatch = section[1].match(/rel="(.*)"/);
    if (!relMatch) {
      return;
    }
    const rel = relMatch[1];
    links[rel] = url;
  });

  return links;
};

// --- 1. Authentication Related Functions ---

export const exchangeCodeForGitHubToken = async (
  code: string
): Promise<{
  accessToken: string;
  scope: string;
  tokenType: string;
  // GitHub refresh tokens are more complex and typically part of GitHub Apps, not standard OAuth web flow
}> => {
  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: environment.github.clientId,
        client_secret: environment.github.clientSecret,
        code,
        redirect_uri: environment.github.redirectUri,
      },
      {
        headers: {
          Accept: "application/json", // Ensures JSON response
        },
      }
    );
    // Note: GitHub might not return refresh_token or expires_in for standard web OAuth flow
    // unless it's a GitHub App or special configuration.
    return {
      accessToken: response.data.access_token,
      scope: response.data.scope,
      tokenType: response.data.token_type,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError<any>;
    console.error(
      "GitHub Service: Error exchanging code for token:",
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub token exchange failed: ${
        axiosError.response?.data?.error_description ||
        axiosError.response?.data?.error ||
        axiosError.message
      }`
    );
  }
};

export const getGitHubUserProfile = async (
  accessToken: string
): Promise<OAuthUserProfile> => {
  try {
    const { data: ghUser } = await githubAPI.get(
      "/user",
      getAuthConfig(accessToken)
    );
    // To get primary verified email, might need 'user:email' scope and a call to /user/emails
    // For simplicity, we use the email from /user endpoint if available
    let primaryEmail = ghUser.email;
    if (!primaryEmail && environment.github.scopes.includes("user:email")) {
      try {
        const { data: emails } = await githubAPI.get(
          "/user/emails",
          getAuthConfig(accessToken)
        );
        const verifiedPrimary = emails.find(
          (e: any) => e.primary && e.verified
        );
        if (verifiedPrimary) {
          primaryEmail = verifiedPrimary.email;
        }
      } catch (emailError) {
        console.warn(
          "GitHub Service: Could not fetch user emails, 'email' field might be null.",
          emailError
        );
      }
    }

    return {
      id: ghUser.id,
      username: ghUser.login,
      name: ghUser.name || ghUser.login,
      email: primaryEmail || null,
      avatar_url: ghUser.avatar_url,
      web_url: ghUser.html_url,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      "GitHub Service: Error fetching user profile:",
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub user profile fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

// --- 2. Data Fetching Functions (Organizations, Repositories, Branches) ---

export const getUserOrganizationsFromGitHub = async (
  accessToken: string
): Promise<Group[]> => {
  try {
    const response = await githubAPI.get("/user/orgs", {
      ...getAuthConfig(accessToken),
      params: { per_page: 100 }, // Handle pagination if user is in >100 orgs
    });
    return response.data.map(
      (ghOrg: any): Group => ({
        id: ghOrg.id,
        provider: "github",
        name: ghOrg.login, // GitHub orgs identified by login
        path: ghOrg.login,
        description: ghOrg.description || null,
        web_url: `https://github.com/${ghOrg.login}`, // Construct web_url
        avatar_url: ghOrg.avatar_url || null,
      })
    );
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      "GitHub Service: Error fetching user organizations:",
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub user organizations fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const fetchRepositoriesFromGitHub = async (
  accessToken: string,
  params: ProjectListParams
): Promise<ProjectListResponse> => {
  const {
    groupOrOrgId,
    orderBy,
    sort,
    search,
    page = 1,
    perPage = 20,
  } = params;

  let url: string;
  const queryParams: any = {
    per_page: perPage,
    page: page,
    sort: orderBy || "pushed", // Map: created, updated, pushed, full_name. Default 'pushed' or 'updated'.
    direction: sort || "desc",
  };

  if (groupOrOrgId) {
    url = `/orgs/${groupOrOrgId}/repos`;
    queryParams.type = "all"; // For orgs: all, public, private, forks, sources, member.
  } else {
    url = "/user/repos";
    // For /user/repos, type can be all, owner, member, public, private.
    // Affiliation: owner, collaborator, organization_member (comma-separated)
    // Defaulting to 'owner' or 'all' for broader results for the user.
    queryParams.type = "owner";
    // queryParams.affiliation = "owner,collaborator"; // Example if needed
  }

  // GitHub's repo list endpoints don't have a direct free-text search param like GitLab.
  // Search is typically via GET /search/repositories.
  // If `params.search` is provided, it might be better to use the search API.
  // For this function, we focus on listing, so `search` is ignored for direct list endpoints.
  if (search) {
    console.warn(
      "GitHub Service: `search` parameter for `fetchRepositoriesFromGitHub` is not directly supported by list endpoints. Use search API for that."
    );
    // Potentially, one could switch to /search/repositories here, but it's a different API structure.
    // For now, we proceed without search for direct listing.
  }

  try {
    const response = await githubAPI.get(url, {
      ...getAuthConfig(accessToken),
      params: queryParams,
    });

    const projects: Project[] = response.data.map(
      (ghRepo: any): Project => ({
        id: ghRepo.id,
        provider: "github",
        name: ghRepo.name,
        path_with_namespace: ghRepo.full_name,
        description: ghRepo.description || null,
        web_url: ghRepo.html_url,
        default_branch: ghRepo.default_branch || null,
        namespace: {
          id: ghRepo.owner.id,
          name: ghRepo.owner.login,
          path: ghRepo.owner.login,
          kind: ghRepo.owner.type === "Organization" ? "organization" : "user",
          avatar_url: ghRepo.owner.avatar_url,
        },
        star_count: ghRepo.stargazers_count,
        forks_count: ghRepo.forks_count,
        last_activity_at: ghRepo.pushed_at, // pushed_at is often more relevant
        created_at: ghRepo.created_at,
        visibility: ghRepo.private ? "private" : "public",
      })
    );

    const links = parseLinkHeader(response.headers.link);
    let totalPages: number | undefined;
    if (links.last) {
      const lastUrl = new URL(links.last);
      totalPages = parseInt(lastUrl.searchParams.get("page") || "0", 10);
    } else if (projects.length > 0 && !links.next) {
      totalPages = page; // If on the last page and it's not empty
    } else if (projects.length === 0 && page === 1) {
      totalPages = 1; // No projects, first page
    }

    // GitHub list APIs don't typically return X-Total-Count.
    // totalProjects would be an estimate or require Search API.
    return {
      projects,
      totalProjects: undefined, // Not reliably available
      totalPages: totalPages,
      currentPage: page,
      perPage: perPage,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      "GitHub Service: Error fetching repositories:",
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub repositories fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const fetchRepositoryDetailsFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string
): Promise<Project> => {
  try {
    const { data: ghRepo } = await githubAPI.get(
      `/repos/${owner}/${repoName}`,
      getAuthConfig(accessToken)
    );
    return {
      id: ghRepo.id,
      provider: "github",
      name: ghRepo.name,
      path_with_namespace: ghRepo.full_name,
      description: ghRepo.description || null,
      web_url: ghRepo.html_url,
      default_branch: ghRepo.default_branch || null,
      namespace: {
        id: ghRepo.owner.id,
        name: ghRepo.owner.login,
        path: ghRepo.owner.login,
        kind: ghRepo.owner.type === "Organization" ? "organization" : "user",
        avatar_url: ghRepo.owner.avatar_url,
      },
      star_count: ghRepo.stargazers_count,
      forks_count: ghRepo.forks_count,
      last_activity_at: ghRepo.pushed_at,
      created_at: ghRepo.created_at,
      visibility: ghRepo.private ? "private" : "public",
    };
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching repository details for ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub repository details fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const fetchBranchesFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  // We might need default_branch from Project details if not fetched separately here
  defaultBranchName?: string | null
): Promise<Branch[]> => {
  try {
    // Fetch project details if defaultBranchName is not provided, to mark the default branch
    let actualDefaultBranch = defaultBranchName;
    if (actualDefaultBranch === undefined) {
      const repoDetails = await fetchRepositoryDetailsFromGitHub(
        accessToken,
        owner,
        repoName
      );
      actualDefaultBranch = repoDetails.default_branch;
    }

    const response = await githubAPI.get(
      `/repos/${owner}/${repoName}/branches`,
      {
        ...getAuthConfig(accessToken),
        params: { per_page: 100 }, // Handle pagination if many branches
      }
    );
    return response.data.map(
      (ghBranch: any): Branch => ({
        provider: "github",
        name: ghBranch.name,
        is_default: ghBranch.name === actualDefaultBranch,
        is_protected: ghBranch.protected,
        commit_sha: ghBranch.commit.sha,
        web_url: `https://github.com/${owner}/${repoName}/tree/${ghBranch.name}`, // Construct web_url
      })
    );
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching branches for ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub branches fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

// --- 3. Data Fetching Functions (Commits) ---

export const fetchCommitsFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  params: {
    branch?: string; // Also known as 'sha' in GitHub API for branch name or commit SHA
    page?: number;
    perPage?: number;
    since?: string | null; // ISO 8601 string
    until?: string | null; // ISO 8601 string
    author?: string; // GitHub login or email
    path?: string; // File path
  }
): Promise<CommitListResponse> => {
  const { branch, page = 1, perPage = 20, since, until, author, path } = params;
  const queryParams: any = {
    sha: branch,
    path,
    author,
    since: since || undefined,
    until: until || undefined,
    per_page: perPage,
    page,
  };

  try {
    const response = await githubAPI.get(
      `/repos/${owner}/${repoName}/commits`,
      {
        ...getAuthConfig(accessToken),
        params: queryParams,
      }
    );

    const commits: Commit[] = response.data.map(
      (ghCommitItem: any): Commit => ({
        id: ghCommitItem.sha,
        provider: "github",
        short_id: ghCommitItem.sha.substring(0, 7),
        title: ghCommitItem.commit.message.split("\n")[0],
        message: ghCommitItem.commit.message,
        author: {
          name: ghCommitItem.commit.author.name,
          email: ghCommitItem.commit.author.email,
        },
        committer: ghCommitItem.commit.committer
          ? {
              name: ghCommitItem.commit.committer.name,
              email: ghCommitItem.commit.committer.email,
            }
          : {
              // Fallback to author if committer is null (can happen for some commit objects)
              name: ghCommitItem.commit.author.name,
              email: ghCommitItem.commit.author.email,
            },
        authored_date: ghCommitItem.commit.author.date,
        committed_date:
          ghCommitItem.commit.committer?.date ||
          ghCommitItem.commit.author.date,
        web_url: ghCommitItem.html_url,
        parent_ids: ghCommitItem.parents.map((p: any) => p.sha),
        // Stats are not included in this list endpoint, would require individual commit fetch.
        stats: undefined,
      })
    );

    const links = parseLinkHeader(response.headers.link);
    const isMore = !!links.next;

    // totalCommits is not available from this GitHub endpoint.
    return {
      commits,
      totalCommits: undefined,
      isMore,
      currentPage: page,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching commits for ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub commits fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const getCommitDetailsAndDiffsFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  commitSha: string
): Promise<CommitDetail> => {
  try {
    const { data: ghCommitDetail } = await githubAPI.get(
      `/repos/${owner}/${repoName}/commits/${commitSha}`,
      getAuthConfig(accessToken)
    );

    const files_changed: CommitDiffFile[] = (ghCommitDetail.files || []).map(
      (file: any): CommitDiffFile => ({
        provider: "github",
        old_path:
          file.status === "renamed"
            ? file.previous_filename
            : file.status === "modified" || file.status === "deleted"
            ? file.filename
            : undefined,
        new_path: file.filename,
        diff: file.patch || "",
        is_new_file: file.status === "added",
        is_renamed_file: file.status === "renamed",
        is_deleted_file: file.status === "removed",
        // a_mode and b_mode are not directly available in file objects from this endpoint
        a_mode: undefined,
        b_mode: undefined,
        // GitHub provides additions/deletions per file if needed: file.additions, file.deletions
      })
    );

    return {
      id: ghCommitDetail.sha,
      provider: "github",
      short_id: ghCommitDetail.sha.substring(0, 7),
      title: ghCommitDetail.commit.message.split("\n")[0],
      message: ghCommitDetail.commit.message,
      author: {
        name: ghCommitDetail.commit.author.name,
        email: ghCommitDetail.commit.author.email,
      },
      committer: ghCommitDetail.commit.committer
        ? {
            name: ghCommitDetail.commit.committer.name,
            email: ghCommitDetail.commit.committer.email,
          }
        : {
            name: ghCommitDetail.commit.author.name,
            email: ghCommitDetail.commit.author.email,
          },
      authored_date: ghCommitDetail.commit.author.date,
      committed_date:
        ghCommitDetail.commit.committer?.date ||
        ghCommitDetail.commit.author.date,
      web_url: ghCommitDetail.html_url,
      parent_ids: ghCommitDetail.parents.map((p: any) => p.sha),
      stats: ghCommitDetail.stats
        ? {
            additions: ghCommitDetail.stats.additions,
            deletions: ghCommitDetail.stats.deletions,
            total: ghCommitDetail.stats.total,
          }
        : undefined,
      files_changed,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching commit details for ${commitSha} in ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub commit details fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const getCommitsBundleForAIFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  commitIds: string[]
): Promise<BackendCommitBundleItem[]> => {
  try {
    const bundles: BackendCommitBundleItem[] = await Promise.all(
      commitIds.map(async (commitId) => {
        const detailedCommit = await getCommitDetailsAndDiffsFromGitHub(
          accessToken,
          owner,
          repoName,
          commitId
        );
        return {
          provider: "github",
          commit_id: detailedCommit.id,
          author_name: detailedCommit.author.name,
          message: detailedCommit.message,
          files_changed: detailedCommit.files_changed.map((fc) => ({
            file_path: fc.new_path, // For simplicity, using new_path. Handle renames if critical.
            diff: fc.diff,
          })),
        };
      })
    );
    return bundles;
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching commit bundles for ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub commit bundles fetch failed: ${
        (axiosError.response?.data as any)?.message || error.message // error.message for Promise.all rejections
      }`
    );
  }
};

// --- 4. Data Fetching Functions (File System) ---

export const getProjectFileTreeFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  treeShaOrBranchName: string,
  recursive: boolean = false
): Promise<RepositoryTreeItem[]> => {
  try {
    // GitHub's API uses a numerical 1 for recursive, not boolean true.
    const queryParams = recursive ? { recursive: "1" } : {};
    const response = await githubAPI.get(
      `/repos/${owner}/${repoName}/git/trees/${treeShaOrBranchName}`,
      {
        ...getAuthConfig(accessToken),
        params: queryParams,
      }
    );

    if (response.data.truncated && recursive) {
      console.warn(
        `GitHub Service: Recursive file tree for ${owner}/${repoName} at ${treeShaOrBranchName} was truncated by GitHub API. Some files might be missing.`
      );
    }

    return (response.data.tree || []).map(
      (item: any): RepositoryTreeItem => ({
        id: item.sha,
        provider: "github",
        name: item.path.includes("/")
          ? item.path.substring(item.path.lastIndexOf("/") + 1)
          : item.path,
        path: item.path,
        type: item.type as "tree" | "blob" | "commit",
        mode: item.mode,
      })
    );
  } catch (error: any) {
    const axiosError = error as AxiosError;
    console.error(
      `GitHub Service: Error fetching project file tree for ${owner}/${repoName}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub file tree fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};

export const getFileContentFromGitHub = async (
  accessToken: string,
  owner: string,
  repoName: string,
  filePath: string,
  ref?: string // Branch name, tag name, or commit SHA
): Promise<string> => {
  try {
    const response = await githubAPI.get(
      `/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`,
      {
        ...getAuthConfig(accessToken),
        params: ref ? { ref } : {},
      }
    );

    const contentData = response.data;
    if (Array.isArray(contentData)) {
      throw new Error(`Path ${filePath} is a directory, not a file.`);
    }

    if (contentData.type !== "file") {
      throw new Error(
        `Requested path ${filePath} is not a file (type: ${contentData.type}).`
      );
    }
    if (contentData.encoding !== "base64") {
      throw new Error(
        `Unexpected content encoding: ${contentData.encoding}. Expected base64.`
      );
    }
    if (typeof contentData.content !== "string") {
      throw new Error("File content is missing or not a string.");
    }

    return Buffer.from(contentData.content, "base64").toString("utf-8");
  } catch (error: any) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      throw new Error(
        `File not found in GitHub repository: ${owner}/${repoName}/${filePath} at ref ${
          ref || "default branch"
        }`
      );
    }
    console.error(
      `GitHub Service: Error fetching file content for ${owner}/${repoName}/${filePath}:`,
      axiosError.response?.data || axiosError.message
    );
    throw new Error(
      `GitHub file content fetch failed: ${
        (axiosError.response?.data as any)?.message || axiosError.message
      }`
    );
  }
};
