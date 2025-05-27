// backend/src/routes/gitlabRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js"; // Your authentication middleware
import {
  getUserGroups,
  getProjects,
  getProjectDetails,
  getProjectBranches,
  getProjectCommits,
  getCommitDetailsAndDiffs,
  getProjectCommitBundlesForAI,
  getProjectFileTree,
  getFileContent,
} from "../controllers/gitlabController.js";

const router: Router = express.Router();

// All routes in this file will be protected and require authentication
router.use(isAuthenticated); // Apply middleware to all routes in this router

// --- GitLab Data Routes ---

// Get groups for the authenticated user
router.get("/user/groups", getUserGroups);

// Get projects
// - For the authenticated user (memberships) if no groupId is provided
// - For a specific group if groupId is provided as a query parameter
// Query params: groupId, orderBy, sort, search, page, perPage
router.get("/projects", getProjects);

// Get details for a specific project
router.get("/projects/:projectId", getProjectDetails);

// Get branches for a specific project
router.get("/projects/:projectId/branches", getProjectBranches);

// Get commits for a specific project and branch
// Query params: branch (ref_name), page, perPage, since, until
router.get("/projects/:projectId/commits", getProjectCommits);

// Get details and diffs for a specific commit
router.get(
  "/projects/:projectId/commits/:commitSha/details",
  getCommitDetailsAndDiffs
);

// Get commit bundles for AI processing (expects commitIds in request body)
router.post(
  "/projects/:projectId/commits-bundle",
  getProjectCommitBundlesForAI
);

// Get repository file tree
// Query params: path (optional), ref (optional, e.g., branch name or commit SHA)
router.get("/projects/:projectId/repository/tree", getProjectFileTree);

// Get raw content of a file
// Query params: filePath (required), ref (required, e.g., branch name or commit SHA)
router.get("/projects/:projectId/repository/file-content", getFileContent);

export default router;
