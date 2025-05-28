// backend/src/controllers/gitlabController.ts
import { Request, Response, NextFunction } from "express";
import * as gitlabService from "../services/gitlabService.js";
import { ProjectListParams } from "../types/index.js"; // Or directly from git.types.js
import { getProviderAccessTokenForUser } from "../services/authService.js";

// Get the actual user's GitLab access token from the stored user data
const getActualUserGitLabAccessToken = async (
  req: Request
): Promise<string | undefined> => {
  if (req.auth?.provider === "gitlab" && req.auth.userId) {
    const token = await getProviderAccessTokenForUser(
      req.auth.userId,
      "gitlab"
    );
    if (token) {
      console.log(
        "[GitLab Controller] Using ACTUAL GitLab Access Token from authService."
      );
      return token;
    } else {
      console.error(
        `🔴 [GitLab Controller] GitLab Access Token NOT FOUND in authService for user ${req.auth.userId}`
      );
      return undefined;
    }
  }
  console.error(
    "🔴 [GitLab Controller] Cannot get GitLab access token: req.auth is missing or provider is not gitlab."
  );
  return undefined;
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const groups = await gitlabService.getUserGroupsFromGitLab(accessToken);
    res.status(200).json(groups);
  } catch (error) {
    next(error); // Pass to global error handler
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }

    // Extract and validate query parameters for listing projects
    const { groupId, orderBy, sort, search, page, perPage } = req.query;
    const params: ProjectListParams = {
      provider: "gitlab", // Explicitly set for this controller
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
    res.status(200).json(projectData);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params; // Assuming projectId is a route parameter
    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    const projectDetails = await gitlabService.fetchProjectDetailsFromGitLab(
      accessToken,
      projectId
    );
    res.status(200).json(projectDetails);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    const branches = await gitlabService.fetchBranchesFromGitLab(
      accessToken,
      projectId
    );
    res.status(200).json(branches);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params;
    const { branch, page, perPage, since, until } = req.query;

    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    if (!branch) {
      res.status(400).json({ message: "Branch name (ref_name) is required." });
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
    res.status(200).json(commitData);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId, commitSha } = req.params;
    if (!projectId || !commitSha) {
      res
        .status(400)
        .json({ message: "Project ID and Commit SHA are required." });
      return;
    }
    const commitDetail = await gitlabService.getCommitDetailsAndDiffsFromGitLab(
      accessToken,
      projectId,
      commitSha
    );
    res.status(200).json(commitDetail);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params;
    const { commitIds } = req.body; // Expecting commitIds in the request body as an array of strings

    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    if (!commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      res.status(400).json({
        message:
          "commitIds (array of strings) is required in the request body.",
      });
      return;
    }

    const bundles = await gitlabService.getCommitsBundleForAIFromGitLab(
      accessToken,
      projectId,
      commitIds
    );
    res.status(200).json(bundles); // Service returns BackendCommitBundleItem[] directly
  } catch (error) {
    next(error);
  }
};

// Add other controller methods for getProjectFileTree, getFileContent as needed
export const getProjectFileTree = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = await getActualUserGitLabAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params;
    const { path, ref } = req.query; // path and ref are optional query params

    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    const treeItems = await gitlabService.getProjectFileTreeFromGitLab(
      accessToken,
      projectId,
      path as string | undefined,
      ref as string | undefined
    );
    res.status(200).json(treeItems);
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
        message: "User is not authenticated with GitLab or token is missing.",
      });
      return;
    }
    const { projectId } = req.params;
    // File path will be part of the route or query. For example: /api/gitlab/projects/:projectId/file-content?path=src/main.ts&ref=main
    // Or if filePath is encoded in the URL path: /api/gitlab/projects/:projectId/file-content/*
    const filePath = req.query.filePath as string; // Assuming filePath is a query parameter
    const ref = req.query.ref as string; // Assuming ref is a query parameter

    if (!projectId) {
      res.status(400).json({ message: "Project ID is required." });
      return;
    }
    if (!filePath) {
      res.status(400).json({
        message: "File path (filePath) is required as a query parameter.",
      });
      return;
    }
    if (!ref) {
      res.status(400).json({
        message:
          "Ref (branch, tag, or commit SHA) is required as a query parameter.",
      });
      return;
    }

    const content = await gitlabService.getFileContentFromGitLab(
      accessToken,
      projectId,
      filePath,
      ref
    );
    res.setHeader("Content-Type", "text/plain"); // Or infer based on file type
    res.send(content);
  } catch (error) {
    next(error);
  }
};
