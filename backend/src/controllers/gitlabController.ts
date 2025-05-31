// backend/src/controllers/gitlabController.ts
import { Request, Response, NextFunction } from "express";
import * as gitlabService from "../services/gitlabService.js";
import { ProjectListParams } from "../types/index.js";
import { tokenVault } from "../services/tokenVault.js";
import { analyticsService } from "../services/analyticsService.js";

/**
 * Get GitLab access token for authenticated user
 * Uses the token vault to retrieve encrypted OAuth tokens
 */
const getActualUserGitLabAccessToken = async (
  req: Request
): Promise<string | undefined> => {
  try {
    if (!req.auth?.userId || req.auth.provider !== "gitlab") {
      console.error(
        "🔴 [GitLab Controller] User not authenticated with GitLab provider"
      );
      return undefined;
    }

    const token = await tokenVault.getToken(String(req.auth.userId), "gitlab");
    if (!token) {
      console.error(
        `🔴 [GitLab Controller] GitLab access token not found for user ${req.auth.userId}`
      );
      return undefined;
    }

    console.log(
      `✅ [GitLab Controller] GitLab token retrieved for user ${req.auth.userId}`
    );
    return token.access_token;
  } catch (error) {
    console.error(
      "[GitLab Controller] Error retrieving GitLab token:",
      error
    );
    return undefined;
  }
};

export const getUserGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const groups = await gitlabService.getUserGroupsFromGitLab(accessToken);

    // Track API usage
    await analyticsService.trackEvent({
      event_type: "project_selected",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "gitlab",
        action: "list_groups",
        group_count: Array.isArray(groups) ? groups.length : 0
      }
    });

    res.status(200).json({
      status: "success",
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { groupId, orderBy, sort, search, page, perPage } = req.query;
    const params: ProjectListParams = {
      provider: "gitlab",
      groupOrOrgId: groupId as string | undefined,
      orderBy: orderBy as ProjectListParams["orderBy"],
      sort: sort as "asc" | "desc" | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      perPage: perPage ? parseInt(perPage as string, 10) : undefined,
    };

    const projectData = await gitlabService.fetchProjectsFromGitLab(
      accessToken,
      params
    );

    // Track API usage
    await analyticsService.trackEvent({
      event_type: "project_selected",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "gitlab",
        action: "list_projects",
        group_id: groupId,
        search_query: search,
        page: page,
        project_count: projectData ? 1 : 0
      }
    });

    res.status(200).json({
      status: "success",
      data: projectData
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({
        status: "error",
        message: "Project ID is required.",
      });
      return;
    }

    const projectDetails = await gitlabService.fetchProjectDetailsFromGitLab(
      accessToken,
      projectId
    );

    res.status(200).json({
      status: "success",
      data: projectDetails
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectBranches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({
        status: "error",
        message: "Project ID is required.",
      });
      return;
    }

    const branches = await gitlabService.fetchBranchesFromGitLab(
      accessToken,
      projectId
    );

    // Track branch listing
    await analyticsService.trackEvent({
      event_type: "branch_changed",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "gitlab",
        project_id: projectId,
        action: "list_branches",
        branch_count: Array.isArray(branches) ? branches.length : 0
      }
    });

    res.status(200).json({
      status: "success",
      data: branches
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectCommits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId } = req.params;
    const { branch, page, perPage, since, until } = req.query;

    if (!projectId) {
      res.status(400).json({
        status: "error",
        message: "Project ID is required.",
      });
      return;
    }

    if (!branch) {
      res.status(400).json({
        status: "error",
        message: "Branch name (ref_name) is required.",
      });
      return;
    }

    const params = {
      branch: branch as string,
      page: page ? parseInt(page as string, 10) : undefined,
      perPage: perPage ? parseInt(perPage as string, 10) : undefined,
      since: since as string | undefined,
      until: until as string | undefined,
    };

    const commitData = await gitlabService.fetchCommitsFromGitLab(
      accessToken,
      projectId,
      params
    );

    // Track commit range selection
    await analyticsService.trackEvent({
      event_type: "commit_range_selected",
      user_id: String(req.auth!.userId),
      metadata: {
        provider: "gitlab",
        project_id: projectId,
        branch: branch,
        commit_count: commitData ? 1 : 0,
        has_date_filter: !!(since || until)
      }
    });

    res.status(200).json({
      status: "success",
      data: commitData
    });
  } catch (error) {
    next(error);
  }
};

export const getCommitDetailsAndDiffs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId, commitSha } = req.params;
    if (!projectId || !commitSha) {
      res.status(400).json({
        status: "error",
        message: "Project ID and commit SHA are required.",
      });
      return;
    }

    const commitDetail = await gitlabService.getCommitDetailsAndDiffsFromGitLab(
      accessToken,
      projectId,
      commitSha
    );

    res.status(200).json({
      status: "success",
      data: commitDetail
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectCommitBundlesForAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId } = req.params;
    const { commitIds } = req.body;

    if (!projectId) {
      res.status(400).json({
        status: "error",
        message: "Project ID is required.",
      });
      return;
    }

    if (!commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      res.status(400).json({
        status: "error",
        message: "commitIds (array of strings) is required in the request body.",
      });
      return;
    }

    const bundles = await gitlabService.getCommitsBundleForAIFromGitLab(
      accessToken,
      projectId,
      commitIds
    );

    res.status(200).json({
      status: "success",
      data: bundles
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectFileTree = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId, treeShaOrBranchName } = req.params;
    const { path } = req.query;

    if (!projectId || !treeShaOrBranchName) {
      res.status(400).json({
        status: "error",
        message: "Project ID and tree SHA/branch name are required.",
      });
      return;
    }

    const treeItems = await gitlabService.getProjectFileTreeFromGitLab(
      accessToken,
      projectId,
      path as string || "",
      treeShaOrBranchName
    );

    res.status(200).json({
      status: "success",
      data: treeItems
    });
  } catch (error) {
    next(error);
  }
};

export const getFileContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        status: "error",
        message: "GitLab authentication required. Please reconnect your GitLab account.",
      });
      return;
    }

    const { projectId } = req.params;
    const { filePath, ref } = req.query;

    if (!projectId) {
      res.status(400).json({
        status: "error",
        message: "Project ID is required.",
      });
      return;
    }

    if (!filePath || typeof filePath !== "string") {
      res.status(400).json({
        status: "error",
        message: "File path (filePath as string) is required as a query parameter.",
      });
      return;
    }

    if (!ref || typeof ref !== "string") {
      res.status(400).json({
        status: "error",
        message: "Ref (branch, tag, or commit SHA) is required as a query parameter.",
      });
      return;
    }

    const content = await gitlabService.getFileContentFromGitLab(
      accessToken,
      projectId,
      filePath,
      ref
    );

    res.setHeader("Content-Type", "text/plain");
    res.send(content);
  } catch (error) {
    next(error);
  }
};
