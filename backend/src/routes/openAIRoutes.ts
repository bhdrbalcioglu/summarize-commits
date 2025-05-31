// backend/src/routes/openAIRoutes.ts
import express, { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { attachSupabaseClient } from "../middleware/supabaseClient.js";
import {
  analyzeCommitsController,
  generateReleaseNotesController,
} from "../controllers/openAIController.js";

const router: Router = express.Router();

// All AI routes require authentication and Supabase client for analytics
router.use(isAuthenticated);
router.use(attachSupabaseClient);

// Analyze commit diffs with OpenAI
// POST body: BackendAnalysisRequest { commitBundle[], language, ... }
router.post("/analyze-commits", analyzeCommitsController);

// Generate release notes from analysis results  
// POST body: BackendUpdateNotesRequest { analysisResults[], language, isAuthorIncluded, ... }
router.post("/generate-notes", generateReleaseNotesController);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "OpenAI service is healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;
