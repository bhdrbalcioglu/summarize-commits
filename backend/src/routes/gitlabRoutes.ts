// backend/src/routes/gitlabRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { attachSupabaseClient } from "../middleware/supabaseClient.js";
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

// All routes require authentication and Supabase client access
router.use(isAuthenticated);
router.use(attachSupabaseClient);

// --- GitLab Data Routes ---

// Get groups for the authenticated user
router.get("/user/groups", getUserGroups);

// Get projects - supports user projects and group projects
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
router.get("/projects/:projectId/commits/:commitSha", getCommitDetailsAndDiffs);

// Get commit bundles for AI processing (POST with commitIds in body)
router.post("/projects/:projectId/commits-bundle", getProjectCommitBundlesForAI);

// Get project file tree
// Updated to match controller parameter expectations
router.get("/projects/:projectId/repository/tree/:treeShaOrBranchName", getProjectFileTree);

// Get file content
// Query params: filePath (required), ref (optional)
router.get("/projects/:projectId/repository/file-content", getFileContent);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "GitLab API service is healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;
