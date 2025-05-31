// backend/src/routes/githubRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { attachSupabaseClient } from "../middleware/supabaseClient.js";
import {
  getUserOrganizations,
  getRepositories,
  getRepositoryDetails,
  getRepositoryBranches,
  getRepositoryCommits,
  getCommitDetailsAndDiffs,
  getRepositoryCommitBundlesForAI,
  getRepositoryFileTree,
  getFileContent,
} from "../controllers/githubController.js";

const router: Router = express.Router();

// All routes require authentication and Supabase client access
router.use(isAuthenticated);
router.use(attachSupabaseClient);

// --- GitHub Data Routes ---

// Get organizations for the authenticated user
router.get("/user/orgs", getUserOrganizations);

// Get repositories - supports both user repos and org repos
// Query params: orgLogin, orderBy, sort, search, page, perPage
router.get("/repos", getRepositories);

// Frontend compatibility endpoint
router.get("/projects", getRepositories);

// Get details for a specific repository
router.get("/repos/:owner/:repoName", getRepositoryDetails);

// Get branches for a specific repository
router.get("/repos/:owner/:repoName/branches", getRepositoryBranches);

// Get commits for a specific repository
// Query params: branch, page, perPage, since, until, author, path
router.get("/repos/:owner/:repoName/commits", getRepositoryCommits);

// Get details and diffs for a specific commit
router.get("/repos/:owner/:repoName/commits/:commitSha", getCommitDetailsAndDiffs);

// Get commit bundles for AI processing (POST with commitIds in body)
router.post("/repos/:owner/:repoName/commits-bundle", getRepositoryCommitBundlesForAI);

// Get repository file tree
router.get("/repos/:owner/:repoName/git/trees/:treeShaOrBranchName", getRepositoryFileTree);

// Get file content
// Query params: filePath (required), ref (optional)
router.get("/repos/:owner/:repoName/contents", getFileContent);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "GitHub API service is healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;
