// backend/src/controllers/githubController.ts
import { Request, Response, NextFunction } from "express";
import * as githubService from "../services/githubService.js";
import { ProjectListParams } from "../types/index.js"; // Or directly from git.types.js
import { UserJwtPayload } from "../types/auth.types.js"; // For req.auth typing
import { tokenVault } from "../services/tokenVault.js";
import { analyticsService } from "../services/analyticsService.js";
import axios from "axios";

/**
 * Get GitHub access token for authenticated user
 * Uses the token vault to retrieve encrypted OAuth tokens
 */
const getActualUserGitHubAccessToken = async (
  req: Request
): Promise<string | undefined> => {
  try {
    if (!req.auth?.userId || req.auth.provider !== "github") {
      console.error(
        "🔴 [GitHub Controller] User not authenticated with GitHub provider"
      );
      return undefined;
    }

    const token = await tokenVault.getToken(String(req.auth.userId), "github");
    if (!token) {
      console.error(
        `🔴 [GitHub Controller] GitHub access token not found for user ${req.auth.userId}`
      );
      return undefined;
    }

    console.log(
      `✅ [GitHub Controller] GitHub token retrieved for user ${req.auth.userId}`
    );
    return token.access_token;
  } catch (error) {
    console.error("[GitHub Controller] Error retrieving GitHub token:", error);
    return undefined;
  }
};

export const getUserOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }

    const organizations = await githubService.getUserOrganizationsFromGitHub(
      accessToken
    );

    // Track API usage
    await analyticsService.trackEvent({
      event_type: "project_selected",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "github",
        action: "list_organizations",
        org_count: Array.isArray(organizations) ? organizations.length : 0,
      },
    });

    res.status(200).json({
      status: "success",
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepositories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("📂 [GitHub Controller] === GET REPOSITORIES START ===");
    console.log(`📂 [GitHub Controller] User ID: ${req.auth?.userId}`);

    // Get user's GitHub access token
    const userId = String(req.auth!.userId); // Convert to string for tokenVault
    const tokenData = await tokenVault.getToken(userId, "github");

    if (!tokenData) {
      console.log("🔴 [GitHub Controller] GitHub access token not found");
      const err = new Error(
        "GitHub authentication required. Please reconnect your GitHub account."
      );
      (err as any).statusCode = 403;
      return next(err);
    }

    const accessToken = tokenData.access_token; // Extract actual token string
    console.log(
      "✅ [GitHub Controller] GitHub token retrieved for user",
      userId
    );
    console.log("🔑 [GitHub Controller] Token length:", accessToken.length);

    // Extract query parameters for pagination and filtering
    // Map GitHub's orderBy values to our standardized ones
    const mapGitHubOrderBy = (
      orderBy: string
    ): ProjectListParams["orderBy"] => {
      switch (orderBy) {
        case "pushed":
          return "last_activity_at";
        case "updated":
          return "updated_at";
        case "created":
          return "created_at";
        case "full_name":
          return "name";
        case "stargazers_count":
          return "star_count";
        default:
          if (
            [
              "created_at",
              "updated_at",
              "last_activity_at",
              "name",
              "star_count",
            ].includes(orderBy)
          ) {
            return orderBy as ProjectListParams["orderBy"];
          }
          return "last_activity_at"; // Default fallback
      }
    };

    const params: ProjectListParams = {
      provider: "github",
      groupOrOrgId: req.query.orgLogin ? String(req.query.orgLogin) : undefined,
      orderBy: req.query.orderBy
        ? mapGitHubOrderBy(String(req.query.orderBy))
        : "last_activity_at",
      sort:
        req.query.sort && ["asc", "desc"].includes(String(req.query.sort))
          ? (String(req.query.sort) as "asc" | "desc")
          : "desc",
      search: req.query.search ? String(req.query.search) : undefined,
      page: req.query.page ? parseInt(String(req.query.page)) : 1,
      perPage: req.query.perPage ? parseInt(String(req.query.perPage)) : 20,
    };

    console.log(
      "📂 [GitHub Controller] Fetching repositories with params:",
      params
    );

    // Add OAuth scope verification - make a test API call to check scopes
    try {
      console.log("🔍 [GitHub Controller] Verifying OAuth scopes...");

      // Create GitHub API client for scope checking
      const scopeCheckResponse = await axios.get(
        "https://api.github.com/user",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Commit-Summarizer-App",
          },
        }
      );

      const scopes = scopeCheckResponse.headers["x-oauth-scopes"];
      const acceptedScopes =
        scopeCheckResponse.headers["x-accepted-oauth-scopes"];

      console.log("🔑 [GitHub Controller] Current OAuth scopes:", scopes);
      console.log(
        "🔑 [GitHub Controller] Accepted OAuth scopes for /user:",
        acceptedScopes
      );

      // Check if we have repo access
      const hasRepoScope = scopes && scopes.includes("repo");
      const hasPublicRepoScope = scopes && scopes.includes("public_repo");

      console.log("📂 [GitHub Controller] Has repo scope:", hasRepoScope);
      console.log(
        "📂 [GitHub Controller] Has public_repo scope:",
        hasPublicRepoScope
      );

      if (!hasRepoScope && !hasPublicRepoScope) {
        console.warn(
          "⚠️ [GitHub Controller] Token lacks repository access scopes!"
        );
        console.warn("⚠️ [GitHub Controller] Available scopes:", scopes);
        console.warn(
          "⚠️ [GitHub Controller] This may result in empty repository list"
        );

        // Return early with informative error for scope issues
        const err = new Error(
          `GitHub token lacks repository access. Current scopes: ${scopes}. Required: 'repo' or 'public_repo'. Please re-authorize the application.`
        );
        (err as any).statusCode = 403;
        return next(err);
      }
    } catch (scopeError) {
      console.error(
        "❌ [GitHub Controller] Failed to verify OAuth scopes:",
        scopeError
      );
      // Don't block the request if scope verification fails
    }

    const response = await githubService.fetchRepositoriesFromGitHub(
      accessToken,
      params
    );

    console.log("📂 [GitHub Controller] Successfully fetched repositories");
    console.log(
      `📂 [GitHub Controller] Found ${response.projects.length} repositories`
    );
    console.log(
      `📂 [GitHub Controller] Total pages: ${response.totalPages || "unknown"}`
    );

    res.status(200).json(response);
  } catch (error: any) {
    console.error("❌ [GitHub Controller] Error in getRepositories:", error);
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName
export const getRepositoryDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    if (!owner || !repoName) {
      res.status(400).json({
        status: "error",
        message: "Owner and repository name are required.",
      });
      return;
    }
    const repoDetails = await githubService.fetchRepositoryDetailsFromGitHub(
      accessToken,
      owner,
      repoName
    );
    res.status(200).json({
      status: "success",
      data: repoDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName/branches
export const getRepositoryBranches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    if (!owner || !repoName) {
      res.status(400).json({
        status: "error",
        message: "Owner and repository name are required.",
      });
      return;
    }
    const branches = await githubService.fetchBranchesFromGitHub(
      accessToken,
      owner,
      repoName
    );

    // Track branch listing
    await analyticsService.trackEvent({
      event_type: "branch_changed",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "github",
        repository: `${owner}/${repoName}`,
        action: "list_branches",
        branch_count: branches?.length || 0,
      },
    });

    res.status(200).json({
      status: "success",
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName/commits
export const getRepositoryCommits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { branch, page, perPage, since, until, author, path } = req.query;

    if (!owner || !repoName) {
      res.status(400).json({
        status: "error",
        message: "Owner and repository name are required.",
      });
      return;
    }

    const params = {
      branch: branch as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      perPage: perPage ? parseInt(perPage as string, 10) : undefined,
      since: since as string | undefined,
      until: until as string | undefined,
      author: author as string | undefined,
      path: path as string | undefined,
    };

    const commitData = await githubService.fetchCommitsFromGitHub(
      accessToken,
      owner,
      repoName,
      params
    );

    // Track commit range selection
    await analyticsService.trackEvent({
      event_type: "commit_range_selected",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "github",
        repository: `${owner}/${repoName}`,
        branch: branch,
        commit_count: commitData ? 1 : 0,
        has_date_filter: !!(since || until),
        has_author_filter: !!author,
      },
    });

    res.status(200).json({
      status: "success",
      data: commitData,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName/commits/:commitSha
export const getCommitDetailsAndDiffs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName, commitSha } = req.params;
    if (!owner || !repoName || !commitSha) {
      res.status(400).json({
        status: "error",
        message: "Owner, repository name, and commit SHA are required.",
      });
      return;
    }
    const commitDetail = await githubService.getCommitDetailsAndDiffsFromGitHub(
      accessToken,
      owner,
      repoName,
      commitSha
    );
    res.status(200).json({
      status: "success",
      data: commitDetail,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like POST /repos/:owner/:repoName/ai/commit-bundles
export const getRepositoryCommitBundlesForAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { commitIds } = req.body;

    if (!owner || !repoName) {
      res.status(400).json({
        status: "error",
        message: "Owner and repository name are required.",
      });
      return;
    }
    if (!commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      res.status(400).json({
        status: "error",
        message:
          "commitIds (array of strings) is required in the request body.",
      });
      return;
    }

    const bundles = await githubService.getCommitsBundleForAIFromGitHub(
      accessToken,
      owner,
      repoName,
      commitIds
    );
    res.status(200).json({
      status: "success",
      data: bundles,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName/tree/:treeShaOrBranchName?recursive=true
export const getRepositoryFileTree = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName, treeShaOrBranchName } = req.params;
    const { recursive } = req.query;

    if (!owner || !repoName || !treeShaOrBranchName) {
      res.status(400).json({
        status: "error",
        message:
          "Owner, repository name, and tree SHA/branch name are required.",
      });
      return;
    }
    const isRecursive = recursive === "true" || recursive === "1";

    const treeItems = await githubService.getProjectFileTreeFromGitHub(
      accessToken,
      owner,
      repoName,
      treeShaOrBranchName,
      isRecursive
    );
    res.status(200).json({
      status: "success",
      data: treeItems,
    });
  } catch (error) {
    next(error);
  }
};

// Assumes routes like /repos/:owner/:repoName/contents?filePath=path/to/file.ts&ref=main
export const getFileContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message:
          "GitHub authentication required. Please reconnect your GitHub account.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { filePath, ref } = req.query;

    if (!owner || !repoName) {
      res.status(400).json({
        status: "error",
        message: "Owner and repository name are required.",
      });
      return;
    }
    if (!filePath || typeof filePath !== "string") {
      res.status(400).json({
        status: "error",
        message:
          "File path (filePath as string) is required as a query parameter.",
      });
      return;
    }

    const content = await githubService.getFileContentFromGitHub(
      accessToken,
      owner,
      repoName,
      filePath,
      ref as string | undefined
    );
    res.setHeader("Content-Type", "text/plain");
    res.send(content);
  } catch (error) {
    next(error);
  }
};
