// backend/src/middleware/isAuthenticated.ts
import { RequestHandler } from "express";
import { getSupabaseClient } from "../config/supabase.js";
import { UserJwtPayload } from "../types/index.js";

// Augment Express's Request type to include our custom 'auth' property
// This allows us to safely use req.auth in subsequent middlewares/controllers
declare global {
  namespace Express {
    interface Request {
      auth?: UserJwtPayload; // This will hold the decoded auth payload
      supabaseUser?: any; // Raw Supabase user object
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    console.log(`🔐 [AUTH MIDDLEWARE DEBUG] Processing ${req.method} ${req.path}`);
    console.log('🔐 [AUTH MIDDLEWARE DEBUG] Request headers:', {
      authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'MISSING',
      cookie: req.headers.cookie ? 'present' : 'missing'
    });
    console.log('🔐 [AUTH MIDDLEWARE DEBUG] Request cookies:', {
      jwt: req.cookies?.jwt ? `${req.cookies.jwt.substring(0, 20)}...` : 'MISSING',
      'sb-access-token': req.cookies?.['sb-access-token'] ? `${req.cookies['sb-access-token'].substring(0, 20)}...` : 'MISSING'
    });
    
    // Get Supabase client
    const supabase = getSupabaseClient('anon');
    
    // HYBRID AUTH: Match frontend priority - cookies first, then headers
    let token: string | undefined;
    let tokenSource = '';
    
    // Priority 1: sb-access-token cookie (most secure, HttpOnly)
    if (req.cookies?.['sb-access-token']) {
      token = req.cookies['sb-access-token'];
      tokenSource = 'sb-access-token cookie';
    }
    
    // Priority 2: Authorization header (fallback for sessionStorage)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
        tokenSource = 'Authorization header (sessionStorage fallback)';
      }
    }
    
    // Priority 3: jwt cookie (legacy fallback)
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
      tokenSource = 'jwt cookie (legacy)';
    }
    
    if (token) {
      console.log(`🔐 [AUTH MIDDLEWARE DEBUG] Using token from: ${tokenSource}`);
    }

    if (!token) {
      console.log('🔐 [AUTH MIDDLEWARE DEBUG] No token found in cookies or Authorization header');
      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Unauthorized: No authentication token provided.",
      });
      return;
    }
    
    console.log('🔐 [AUTH MIDDLEWARE DEBUG] Found token:', `${token.substring(0, 20)}...`);

    // Verify the token with Supabase
    console.log('🔐 [AUTH MIDDLEWARE DEBUG] Verifying token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('🔐 [AUTH MIDDLEWARE DEBUG] Supabase verification result:', {
      user: user ? {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider
      } : 'NULL',
      error: error ? {
        message: error.message,
        status: error.status
      } : 'NONE'
    });

    if (error || !user) {
      console.error("🔴 [AUTH MIDDLEWARE DEBUG] Supabase auth error:", error?.message);
      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Forbidden: Invalid or expired token.",
      });
      return;
    }

    // Extract provider information from user metadata
    const provider = user.app_metadata?.provider || 'unknown';
    const providerUserId = user.user_metadata?.provider_id || user.id;

    // Create compatible auth payload for existing controllers
    req.auth = {
      userId: user.id, // Supabase user ID
      providerUserId: providerUserId,
      provider: provider as any, // Cast to GitProvider type
      username: user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'unknown',
    };

    // Also store raw Supabase user for advanced use cases
    req.supabaseUser = user;

    console.log(`✅ [AUTH MIDDLEWARE DEBUG] User authenticated: ${req.auth.username} (${req.auth.provider})`);
    console.log('✅ [AUTH MIDDLEWARE DEBUG] Auth payload:', req.auth);
    next(); // Token is valid, proceed to the next middleware or route handler

  } catch (error: any) {
    console.error("[AuthMiddleware] Unexpected authentication error:", error.message);
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error during authentication.",
    });
    return;
  }
};
