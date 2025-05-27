// backend/src/controllers/githubController.ts
import { Request, Response, NextFunction } from "express";
import * as githubService from "../services/githubService.js";
import { ProjectListParams } from "../types/index.js"; // Or directly from git.types.js
import { UserJwtPayload } from "../types/auth.types.js"; // For req.auth typing
import { getProviderAccessTokenForUser } from "../services/authService.js";
const getActualUserGitHubAccessToken = async (
  req: Request
): Promise<string | undefined> => {
  if (req.auth?.provider === "github" && req.auth.userId) {
    const token = await getProviderAccessTokenForUser(
      req.auth.userId,
      "github"
    );
    if (token) {
      console.log(
        "[GitHub Controller] Using ACTUAL GitHub Access Token from authService."
      );
      return token;
    } else {
      console.error(
        `🔴 [GitHub Controller] GitHub Access Token NOT FOUND in authService for user ${req.auth.userId}`
      );
      return undefined;
    }
  }
  console.error(
    "🔴 [GitHub Controller] Cannot get GitHub access token: req.auth is missing or provider is not github."
  );
  return undefined;
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const organizations = await githubService.getUserOrganizationsFromGitHub(
      accessToken
    );
    res.status(200).json(organizations);
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
    const accessToken = await getActualUserGitHubAccessToken(req);
    if (!accessToken) {
      res.status(403).json({
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }

    const { orgLogin, orderBy, sort, search, page, perPage } = req.query;
    const params: ProjectListParams = {
      provider: "github",
      groupOrOrgId: orgLogin as string | undefined,
      orderBy: orderBy as ProjectListParams["orderBy"],
      sort: sort as "asc" | "desc" | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      perPage: perPage ? parseInt(perPage as string, 10) : undefined,
    };

    const repoData = await githubService.fetchRepositoriesFromGitHub(
      accessToken,
      params
    );
    res.status(200).json(repoData);
  } catch (error) {
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    if (!owner || !repoName) {
      res
        .status(400)
        .json({ message: "Owner and repository name are required." });
      return;
    }
    const repoDetails = await githubService.fetchRepositoryDetailsFromGitHub(
      accessToken,
      owner,
      repoName
    );
    res.status(200).json(repoDetails);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    if (!owner || !repoName) {
      res
        .status(400)
        .json({ message: "Owner and repository name are required." });
      return;
    }
    const branches = await githubService.fetchBranchesFromGitHub(
      accessToken,
      owner,
      repoName
    );
    res.status(200).json(branches);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { branch, page, perPage, since, until, author, path } = req.query;

    if (!owner || !repoName) {
      res
        .status(400)
        .json({ message: "Owner and repository name are required." });
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
    res.status(200).json(commitData);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName, commitSha } = req.params;
    if (!owner || !repoName || !commitSha) {
      res.status(400).json({
        message: "Owner, repository name, and Commit SHA are required.",
      });
      return;
    }
    const commitDetail = await githubService.getCommitDetailsAndDiffsFromGitHub(
      accessToken,
      owner,
      repoName,
      commitSha
    );
    res.status(200).json(commitDetail);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { commitIds } = req.body;

    if (!owner || !repoName) {
      res
        .status(400)
        .json({ message: "Owner and repository name are required." });
      return;
    }
    if (!commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      res.status(400).json({
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
    res.status(200).json(bundles);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName, treeShaOrBranchName } = req.params;
    const { recursive } = req.query;

    if (!owner || !repoName || !treeShaOrBranchName) {
      res.status(400).json({
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
    res.status(200).json(treeItems);
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
        message: "User is not authenticated with GitHub or token is missing.",
      });
      return;
    }
    const { owner, repoName } = req.params;
    const { filePath, ref } = req.query;

    if (!owner || !repoName) {
      res
        .status(400)
        .json({ message: "Owner and repository name are required." });
      return;
    }
    if (!filePath || typeof filePath !== "string") {
      res.status(400).json({
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
