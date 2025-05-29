// backend/src/routes/authRoutes.ts
import express, { Router } from "express";
import {
  // You'll need a generic redirectToProvider or adapt existing ones
  redirectToProviderHandler, // A NEW or MODIFIED controller function
  gitlabCallback, // Keep specific callbacks for now, or make generic too
  githubCallback,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router: Router = express.Router();

// --- OAuth Initiation Route (Parameterized) ---
router.get("/login/:provider", redirectToProviderHandler); // CHANGED: Now expects /login/gitlab or /login/github

// --- OAuth Callback Routes ---
router.get("/gitlab/callback", gitlabCallback); // This is hit by GitLab redirecting back
router.get("/github/callback", githubCallback); // This is hit by GitHub redirecting back

// --- User Session Routes ---
router.get("/me", isAuthenticated, getCurrentUser);
router.post("/logout", isAuthenticated, logoutUser); // Enable authentication check for logout
export default router;
