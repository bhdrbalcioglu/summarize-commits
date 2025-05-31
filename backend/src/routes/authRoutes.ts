// backend/src/routes/authRoutes.ts
import express, { Router } from "express";
import {
  redirectToProviderHandler,
  authCallback,
  getCurrentUser,
  logoutUser,
  sessionHandoff,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { attachSupabaseClient } from "../middleware/supabaseClient.js";

const router: Router = express.Router();

// --- OAuth Initiation Routes ---
// Redirect to Supabase Auth for OAuth login
router.get("/login/:provider", redirectToProviderHandler);

// --- OAuth Callback Routes ---
// Supabase Auth callback (handles both GitHub and GitLab)
router.get("/callback", authCallback);

// Legacy callback routes for backward compatibility
router.get("/gitlab/callback", authCallback);
router.get("/github/callback", authCallback);

// --- User Session Routes ---
// Handle session handoff from frontend OAuth (no prior authentication required)
router.post("/session", express.json(), sessionHandoff);

// Get current user information (requires authentication + Supabase client)
router.get("/me", isAuthenticated, attachSupabaseClient, getCurrentUser);

// Logout user (no authentication required - should work even with invalid/missing tokens)
router.post("/logout", attachSupabaseClient, logoutUser);

// Health check route (no authentication required)
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
