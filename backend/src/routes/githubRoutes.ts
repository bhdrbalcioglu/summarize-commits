// backend/src/routes/githubRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
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

// All routes in this file will be protected and require authentication
router.use(isAuthenticated); // Apply middleware to all routes in this router

// --- GitHub Data Routes ---

// Get organizations for the authenticated user
router.get("/user/orgs", getUserOrganizations);

// Get repositories
// - For the authenticated user if no orgLogin is provided
// - For a specific organization if orgLogin is provided as a query parameter
// Query params: orgLogin, orderBy, sort, search, page, perPage
router.get("/repos", getRepositories); // Or /user/repos and /orgs/:orgLogin/repos for more explicitness

// Add /projects route that maps to the same getRepositories function for frontend compatibility
router.get("/projects", getRepositories); // Frontend expects this endpoint

// To explicitly list repos for an organization (if you prefer separate routes)
// router.get("/orgs/:orgLogin/repos", getRepositories); // Controller would need to handle orgLogin from params

// Get details for a specific repository
// Uses :owner and :repoName as path parameters
router.get("/repos/:owner/:repoName", getRepositoryDetails);

// Get branches for a specific repository
router.get("/repos/:owner/:repoName/branches", getRepositoryBranches);

// Get commits for a specific repository
// Query params: branch (sha), page, perPage, since, until, author, path
router.get("/repos/:owner/:repoName/commits", getRepositoryCommits);

// Get details and diffs for a specific commit
router.get(
  "/repos/:owner/:repoName/commits/:commitSha", // GitHub typically doesn't have '/details' in the path
  getCommitDetailsAndDiffs
);

// Get commit bundles for AI processing (expects commitIds in request body)
router.post(
  "/repos/:owner/:repoName/commits-bundle",
  getRepositoryCommitBundlesForAI
);

// Get repository file tree
// :treeShaOrBranchName is a path parameter. Query: recursive
router.get(
  "/repos/:owner/:repoName/git/trees/:treeShaOrBranchName",
  getRepositoryFileTree
);

// Get raw content of a file
// Query params: filePath (required), ref (optional, e.g., branch name or commit SHA)
// Note: filePath is a query param here to handle slashes easily.
// Alternatively, use a wildcard like /repos/:owner/:repoName/contents/* and extract path from req.params[0]
router.get("/repos/:owner/:repoName/contents", getFileContent);

export default router;
