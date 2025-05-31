import { RequestHandler } from "express";
import { createUserClient, getSupabaseClient } from "../config/supabase.js";

// Augment Express Request to include Supabase clients
declare global {
  namespace Express {
    interface Request {
      supabaseClient?: ReturnType<typeof createUserClient>;
      supabaseServiceClient?: ReturnType<typeof getSupabaseClient>;
    }
  }
}

/**
 * Middleware that provides Supabase clients on the request object
 * Should be used after isAuthenticated middleware for user-scoped operations
 */
export const attachSupabaseClient: RequestHandler = async (req, res, next) => {
  try {
    // Attach service role client (for admin operations)
    req.supabaseServiceClient = getSupabaseClient('service');

    // If user is authenticated, create user-scoped client
    if (req.auth) {
      // Extract token from cookies or header
      let token = req.cookies?.jwt;
      
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        }
      }

      if (token) {
        // Create user-scoped client with their session
        req.supabaseClient = createUserClient(token);
      }
    }

    next();
  } catch (error) {
    console.error("[SupabaseClientMiddleware] Error attaching Supabase clients:", error);
    next(); // Continue anyway, some operations might not need user client
  }
};

/**
 * Middleware specifically for routes that require authenticated Supabase client
 * Use this for operations that definitely need user session
 */
export const requireSupabaseClient: RequestHandler = (req, res, next) => {
  if (!req.supabaseClient) {
    res.status(401).json({
      status: "error",
      statusCode: 401,
      message: "Unauthorized: Valid user session required.",
    });
    return;
  }
  next();
}; 