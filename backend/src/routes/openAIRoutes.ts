// backend/src/routes/openAIRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  analyzeCommitsController,
  generateReleaseNotesController,
} from "../controllers/openAIController.js";

const router: Router = express.Router();

// All AI routes will require authentication
router.use(isAuthenticated);

// Route to analyze commit diffs
// Expects BackendAnalysisRequest in the request body
router.post("/analyze-commits", analyzeCommitsController);

// Route to generate update/release notes from analysis results
// Expects BackendUpdateNotesRequest in the request body
router.post("/generate-notes", generateReleaseNotesController);

export default router;
