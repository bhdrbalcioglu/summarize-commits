// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import { environment } from "../config/index.js";
import { getSupabaseClient } from "../config/supabase.js";
import { User, GitProvider } from "../types/index.js";
import userRepository from "../services/userRepo.js";
import analyticsService from "../services/analyticsService.js";

/**
 * Redirect to Supabase Auth for OAuth login
 * Since we're using Supabase Auth, we redirect to their OAuth endpoints
 */
export const redirectToProviderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { provider } = req.params;
    console.log(
      `🔗 [AUTH REDIRECT] Starting OAuth flow for provider: ${provider}`
    );
    console.log(`🔗 [AUTH REDIRECT] Request details:`, {
      userAgent: req.get("user-agent")?.substring(0, 50) + "...",
      referer: req.get("referer"),
      ip: req.ip || req.connection.remoteAddress,
    });

    if (!["github", "gitlab"].includes(provider)) {
      const error = new Error("Unsupported OAuth provider specified.");
      (error as any).statusCode = 400;
      return next(error);
    }

    const supabase = getSupabaseClient("anon");

    // Use Supabase Auth to handle OAuth redirect
    const redirectUrl = `${environment.BACKEND_URL}/api/auth/callback`;
    console.log(
      `🔗 [AUTH REDIRECT] Environment BACKEND_URL: ${environment.BACKEND_URL}`
    );
    console.log(`🔗 [AUTH REDIRECT] Computed redirect URL: ${redirectUrl}`);

    console.log(`🔗 [AUTH REDIRECT] Calling Supabase signInWithOAuth with:`, {
      provider: provider,
      redirectTo: redirectUrl,
      scopes:
        provider === "github"
          ? "user:email repo"
          : "read_user read_api read_repository",
      queryParams: { access_type: "offline", prompt: "consent" },
      skipBrowserRedirect: true,
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUrl,
        scopes:
          provider === "github"
            ? "user:email repo"
            : "read_user read_api read_repository",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        skipBrowserRedirect: true, // Important: We handle redirect manually on server
      },
    });

    console.log(`🔗 [AUTH REDIRECT] Supabase response:`, {
      hasData: !!data,
      hasError: !!error,
      dataUrl: data?.url ? data.url.substring(0, 100) + "..." : "none",
      errorMessage: error?.message || "none",
    });

    if (error) {
      console.error(
        `❌ [AUTH REDIRECT] Supabase OAuth error for ${provider}:`,
        {
          message: error.message,
          code: error.status,
          provider: provider,
        }
      );
      const err = new Error(
        `Failed to initiate OAuth with ${provider}: ${error.message}`
      );
      (err as any).statusCode = 500;
      return next(err);
    }

    if (data.url) {
      console.log(`✅ [AUTH REDIRECT] Received OAuth URL from Supabase`);
      console.log(
        `🔀 [AUTH REDIRECT] Redirecting user to: ${data.url.substring(
          0,
          80
        )}...`
      );
      console.log(`🔀 [AUTH REDIRECT] Full URL for debugging: ${data.url}`);
      // Redirect to Supabase OAuth URL
      res.redirect(data.url);
    } else {
      console.error(
        `❌ [AUTH REDIRECT] No OAuth URL returned from Supabase for ${provider}`
      );
      const err = new Error(
        `No OAuth URL returned from Supabase for ${provider}`
      );
      (err as any).statusCode = 500;
      return next(err);
    }
  } catch (error: any) {
    console.error(
      `[AUTH CONTROLLER] Error in redirectToProviderHandler:`,
      error
    );
    next(error);
  }
};

/**
 * Handle OAuth callback from Supabase (if needed)
 * In most cases, Supabase handles this directly and redirects to frontend
 */
export const authCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(
      `🔗 [AUTH CALLBACK] ============= CALLBACK START =============`
    );
    console.log(
      `🔗 [AUTH CALLBACK] Processing OAuth callback from ${
        req.get("referer") || "unknown"
      }`
    );
    console.log(`🔗 [AUTH CALLBACK] Request details:`, {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      queryParams: req.query,
      queryString: req.url?.split("?")[1] || "no query string",
      rawQuery: JSON.stringify(req.query, null, 2),
      headers: {
        referer: req.get("referer"),
        userAgent: req.get("user-agent"),
        host: req.get("host"),
        origin: req.get("origin"),
      },
    });

    // Check for errors first
    const { error, error_description, error_code } = req.query;
    if (error) {
      console.error("❌ [AUTH CALLBACK] OAuth callback error:", {
        error,
        error_description,
        error_code,
      });
      const redirectUrl = `${
        environment.FRONTEND_URL
      }/login?error=${encodeURIComponent(error as string)}`;
      console.log(
        `🔀 [AUTH CALLBACK] Redirecting to frontend with error: ${redirectUrl}`
      );
      return res.redirect(redirectUrl);
    }

    // Check for authorization code (PKCE flow)
    const { code } = req.query;
    if (code) {
      console.log(
        `✅ [AUTH CALLBACK] Received authorization code: ${(
          code as string
        ).substring(0, 20)}...`
      );

      try {
        // Exchange code for session using Supabase
        const supabase = getSupabaseClient("anon");
        const { data, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code as string);

        if (sessionError) {
          console.error(
            "❌ [AUTH CALLBACK] Error exchanging code for session:",
            sessionError
          );
          const redirectUrl = `${environment.FRONTEND_URL}/login?error=session_exchange_failed`;
          return res.redirect(redirectUrl);
        }

        if (data.session && data.session.access_token) {
          console.log(`✅ [AUTH CALLBACK] Session created successfully`);
          console.log(`✅ [AUTH CALLBACK] User: ${data.session.user.email}`);

          // Cross-origin compatible cookie settings
          const cookieOptions = {
            httpOnly: true,
            secure: environment.NODE_ENV === "production",
            sameSite:
              environment.NODE_ENV === "production"
                ? ("none" as const)
                : ("lax" as const),
            maxAge: 3600000, // 1 hour
          };

          console.log(`🍪 [AUTH CALLBACK] Cookie settings:`, {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            environment: environment.NODE_ENV,
          });

          // Set tokens in cookies
          res.cookie(
            "sb-access-token",
            data.session.access_token,
            cookieOptions
          );
          console.log(`✅ [AUTH CALLBACK] Set sb-access-token cookie`);

          if (data.session.refresh_token) {
            res.cookie("sb-refresh-token", data.session.refresh_token, {
              ...cookieOptions,
              maxAge: 30 * 24 * 3600000, // 30 days
            });
            console.log(`✅ [AUTH CALLBACK] Set sb-refresh-token cookie`);
          }

          const redirectUrl = `${environment.FRONTEND_URL}/auth/callback?success=true`;
          console.log(
            `🔀 [AUTH CALLBACK] Redirecting to frontend: ${redirectUrl}`
          );
          res.redirect(redirectUrl);
          return;
        }
      } catch (exchangeError: any) {
        console.error(
          "💥 [AUTH CALLBACK] Error during code exchange:",
          exchangeError
        );
        const redirectUrl = `${environment.FRONTEND_URL}/login?error=code_exchange_failed`;
        return res.redirect(redirectUrl);
      }
    }

    // Legacy: Check for direct access_token (fallback for implicit flow)
    const { access_token, refresh_token } = req.query;
    if (access_token) {
      console.log(
        `✅ [AUTH CALLBACK] Received direct access token (legacy flow)`
      );

      // Cross-origin compatible cookie settings
      const cookieOptions = {
        httpOnly: true,
        secure: environment.NODE_ENV === "production",
        sameSite:
          environment.NODE_ENV === "production"
            ? ("none" as const)
            : ("lax" as const),
        maxAge: 3600000, // 1 hour
      };

      // Set tokens in cookies
      res.cookie("sb-access-token", access_token, cookieOptions);
      console.log(`✅ [AUTH CALLBACK] Set sb-access-token cookie (legacy)`);

      if (refresh_token) {
        res.cookie("sb-refresh-token", refresh_token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 3600000, // 30 days
        });
        console.log(`✅ [AUTH CALLBACK] Set sb-refresh-token cookie (legacy)`);
      }

      const redirectUrl = `${environment.FRONTEND_URL}/auth/callback?success=true`;
      console.log(`🔀 [AUTH CALLBACK] Redirecting to frontend: ${redirectUrl}`);
      res.redirect(redirectUrl);
      return;
    }

    // If we get here, we didn't receive the expected parameters
    console.error(
      `❌ [AUTH CALLBACK] No authorization code or access token received`
    );
    console.log(`🔍 [AUTH CALLBACK] Available params:`, Object.keys(req.query));
    const redirectUrl = `${environment.FRONTEND_URL}/login?error=no_tokens`;
    console.log(
      `🔀 [AUTH CALLBACK] Redirecting to frontend with error: ${redirectUrl}`
    );
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("💥 [AUTH CALLBACK] Unexpected error during callback:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      headers: {
        referer: req.get("referer"),
        userAgent: req.get("user-agent"),
      },
    });
    const redirectUrl = `${environment.FRONTEND_URL}/login?error=callback_failed`;
    console.log(`🔀 [AUTH CALLBACK] Error redirect: ${redirectUrl}`);
    res.redirect(redirectUrl);
  }
};

/**
 * Get current user information
 * Uses Supabase session and our user repo for additional data
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`👤 [GET CURRENT USER] Processing request for user session`);
    console.log(`👤 [GET CURRENT USER] Auth object present: ${!!req.auth}`);
    console.log(
      `👤 [GET CURRENT USER] Supabase user present: ${!!req.supabaseUser}`
    );

    if (req.auth) {
      console.log(`👤 [GET CURRENT USER] Auth details:`, {
        userId: req.auth.userId,
        provider: req.auth.provider,
        username: req.auth.username,
      });
    }

    if (!req.auth || !req.supabaseUser) {
      console.log(
        `❌ [GET CURRENT USER] Authentication failed - missing auth objects`
      );
      res.status(401).json({
        status: "error",
        message: "User not authenticated",
      });
      return;
    }

    const supabaseUser = req.supabaseUser;
    console.log(`👤 [GET CURRENT USER] Supabase user ID: ${supabaseUser.id}`);
    console.log(
      `👤 [GET CURRENT USER] Supabase user email: ${supabaseUser.email}`
    );

    // Get or create user profile in our database
    console.log(`🔍 [GET CURRENT USER] Looking up user profile in database...`);
    let userProfile = await userRepository.getProfileById(supabaseUser.id);

    if (!userProfile) {
      console.log(
        `🆕 [GET CURRENT USER] User profile not found, creating new profile...`
      );
      // Create user profile from Supabase user data
      const provider = supabaseUser.app_metadata?.provider || "unknown";
      const username =
        supabaseUser.user_metadata?.user_name ||
        supabaseUser.user_metadata?.preferred_username ||
        supabaseUser.email?.split("@")[0] ||
        "unknown";

      console.log(`🆕 [GET CURRENT USER] Creating profile for:`, {
        provider: provider,
        username: username,
        email: supabaseUser.email,
      });

      userProfile = await userRepository.upsertProfile({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        provider: provider as GitProvider,
        username: username,
        display_name: supabaseUser.user_metadata?.full_name || username,
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`✅ [GET CURRENT USER] User profile created successfully`);

      // Track user creation event
      console.log(`📊 [GET CURRENT USER] Tracking new user login event...`);
      await analyticsService.trackEvent({
        event_type: "user_login",
        user_id: supabaseUser.id,
        metadata: {
          provider: provider,
          username: username,
          login_method: "oauth",
          is_new_user: true,
        },
      });
    } else {
      console.log(
        `✅ [GET CURRENT USER] Found existing user profile: ${userProfile.username} (${userProfile.provider})`
      );
    }

    // Transform userProfile to match frontend User interface
    const frontendUser = {
      id: userProfile.id,
      username: userProfile.username,
      name: userProfile.display_name || userProfile.username,
      avatar_url: userProfile.avatar_url || "",
      provider: userProfile.provider,
      email: userProfile.email || supabaseUser.email,
      web_url: userProfile.web_url,
      bio: userProfile.bio,
      location: userProfile.location,
      company: userProfile.company,
      website_url: userProfile.website_url,
      twitter_username: userProfile.twitter_username,
      linkedin: userProfile.linkedin,
      discord: userProfile.discord,
      public_email: userProfile.public_email,
      job_title: userProfile.job_title,
      pronouns: userProfile.pronouns,
      public_repos: userProfile.public_repos,
      followers: userProfile.followers,
      following: userProfile.following,
      is_bot: userProfile.is_bot,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
      last_activity_on: userProfile.last_activity_on,
      provider_metadata: userProfile.provider_metadata,
    };

    // Return user profile in expected frontend format
    console.log(`✅ [GET CURRENT USER] Returning user data:`, {
      id: frontendUser.id,
      username: frontendUser.username,
      provider: frontendUser.provider,
      email: frontendUser.email?.substring(0, 3) + "***", // Partial email for privacy
    });
    res.status(200).json(frontendUser);
  } catch (error: any) {
    console.error("💥 [GET CURRENT USER] Error:", {
      message: error.message,
      stack: error.stack,
      authPresent: !!req.auth,
      supabaseUserPresent: !!req.supabaseUser,
    });
    next(error);
  }
};

/**
 * Handle session handoff from frontend OAuth flow
 * Verifies tokens from frontend and sets HttpOnly cookies
 */
export const sessionHandoff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("🔗 [SESSION HANDOFF] Request received:", {
      method: req.method,
      url: req.url,
      headers: {
        "content-type": req.get("content-type"),
        authorization: req.get("authorization") ? "present" : "missing",
      },
      bodyKeys: Object.keys(req.body || {}),
      body: req.body,
    });

    const { access_token, refresh_token, provider_token, provider_refresh_token } = req.body;

    if (!access_token) {
      console.log("❌ [SESSION HANDOFF] Missing access_token in request body");
      res.status(400).json({ error: "missing access_token" });
      return;
    }

    console.log("🔑 [SESSION HANDOFF] Provider tokens from frontend:", {
      hasProviderToken: !!provider_token,
      hasProviderRefreshToken: !!provider_refresh_token
    });

    console.log(
      "🔗 [SESSION HANDOFF] Processing session handoff from frontend"
    );

    // 1️⃣ Get session data including provider tokens
    const supabase = getSupabaseClient("anon");

    // First, try to get user info to see current session state
    console.log(`🔍 [SESSION HANDOFF] Checking current session state...`);
    const { data: currentUser, error: userError } = await supabase.auth.getUser(
      access_token
    );

    if (userError || !currentUser?.user) {
      console.error("❌ [SESSION HANDOFF] Invalid token:", userError);
      res.status(401).json({ error: "invalid token" });
      return;
    }

    console.log(
      `✅ [SESSION HANDOFF] Token verified for user: ${currentUser.user.email}`
    );
    console.log(`🔑 [SESSION HANDOFF] User metadata:`, {
      provider: currentUser.user.app_metadata?.provider,
      providerData: currentUser.user.user_metadata,
    });

    // Set the session to try to get provider tokens
    let { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || "",
      });

    if (sessionError || !sessionData.session) {
      console.error(
        "❌ [SESSION HANDOFF] Failed to set session:",
        sessionError
      );
      // Continue with current user data
      sessionData = {
        session: {
          access_token,
          refresh_token: refresh_token || "",
          expires_in: 3600,
          token_type: "bearer",
          user: currentUser.user,
          provider_token: null,
          provider_refresh_token: null,
        } as any,
        user: currentUser.user,
      };
    }

    const { user, session } = sessionData;
    console.log(
      `🔑 [SESSION HANDOFF] Provider token available:`,
      !!session?.provider_token
    );
    console.log(
      `🔑 [SESSION HANDOFF] Provider refresh token available:`,
      !!session?.provider_refresh_token
    );
    console.log(
      `🔑 [SESSION HANDOFF] Session data keys:`,
      Object.keys(session || {})
    );

    // 2️⃣ Set HttpOnly cookies with same settings as existing flow
    const cookieOptions = {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
      sameSite:
        environment.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
      maxAge: 60 * 60 * 1000, // 1 hour
    };

    res.cookie("sb-access-token", access_token, cookieOptions);

    if (refresh_token) {
      res.cookie("sb-refresh-token", refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    console.log(`🍪 [SESSION HANDOFF] Cookies set successfully`);

    // 3️⃣ Manually populate auth objects that getCurrentUser expects
    req.headers.authorization = `Bearer ${access_token}`;

    // Set up req.auth object (mimicking isAuthenticated middleware)
    if (!user?.id) {
      console.error("❌ [SESSION HANDOFF] User ID missing from session");
      res.status(401).json({ error: "invalid user data" });
      return;
    }

    const authPayload = {
      userId: user.id,
      providerUserId:
        user.user_metadata?.provider_id || user.user_metadata?.sub,
      provider: (user.app_metadata?.provider || "unknown") as GitProvider,
      username:
        user.user_metadata?.user_name ||
        user.user_metadata?.preferred_username ||
        user.email?.split("@")[0] ||
        "unknown",
    };
    req.auth = authPayload;

    // Set up req.supabaseUser object (mimicking attachSupabaseClient middleware)
    req.supabaseUser = user;

    console.log(`🔗 [SESSION HANDOFF] Auth objects populated:`, {
      authUserId: authPayload.userId,
      authProvider: authPayload.provider,
      supabaseUserId: user.id,
    });

    // 4️⃣ Store the GitHub/GitLab provider access token for API calls
    if (
      authPayload.provider === "github" ||
      authPayload.provider === "gitlab"
    ) {
      try {
        // Check if we have provider tokens from frontend or session
        const actualProviderToken = provider_token || session?.provider_token;
        const actualProviderRefreshToken = provider_refresh_token || session?.provider_refresh_token;

        if (actualProviderToken) {
          console.log(
            `🔑 [SESSION HANDOFF] Storing ${authPayload.provider} provider access token...`
          );
          console.log(`🔑 [SESSION HANDOFF] Token source: ${provider_token ? 'frontend' : 'session'}`);

          const { tokenVault } = await import("../services/tokenVault.js");
          await tokenVault.storeToken({
            user_id: user.id,
            provider: authPayload.provider,
            access_token: actualProviderToken, // Use the actual provider token
            refresh_token: actualProviderRefreshToken || undefined,
            token_type: "Bearer",
            scope: user.user_metadata?.scope || undefined,
          });

          console.log(
            `✅ [SESSION HANDOFF] ${authPayload.provider} provider token stored successfully`
          );
        } else {
          console.warn(
            `⚠️ [SESSION HANDOFF] No provider token available for ${authPayload.provider} - user may need to re-authenticate`
          );
        }
      } catch (tokenError) {
        console.error(
          `❌ [SESSION HANDOFF] Failed to store ${authPayload.provider} token:`,
          tokenError
        );
        // Don't fail the entire flow, just log the error
      }
    }

    // Call getCurrentUser to handle user creation/retrieval and return user data
    return getCurrentUser(req, res, next);
  } catch (error: any) {
    console.error("💥 [SESSION HANDOFF] Error:", error);
    next(error);
  }
};

/**
 * Logout user
 * Clears Supabase session and any local cookies
 * NOTE: This endpoint accepts requests from both authenticated and unauthenticated users
 */
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("[AUTH CONTROLLER] Processing logout request...");

    // Track logout event if user is authenticated
    if (req.auth?.userId) {
      console.log(
        `[AUTH CONTROLLER] Tracking logout for user: ${req.auth.userId}`
      );
      try {
        await analyticsService.trackEvent({
          event_type: "user_logout",
          user_id: String(req.auth.userId),
          metadata: {
            provider: req.auth.provider,
          },
        });
      } catch (analyticsError) {
        console.warn(
          "[AUTH CONTROLLER] Analytics tracking failed during logout:",
          analyticsError
        );
        // Don't fail logout if analytics fails
      }
    } else {
      console.log(
        "[AUTH CONTROLLER] Logout request from unauthenticated user (clearing cookies only)"
      );
    }

    // Get user-scoped Supabase client and sign out (if available)
    if (req.supabaseClient) {
      try {
        await req.supabaseClient.auth.signOut();
        console.log("[AUTH CONTROLLER] Supabase session signed out");
      } catch (supabaseError) {
        console.warn(
          "[AUTH CONTROLLER] Supabase signOut failed:",
          supabaseError
        );
        // Don't fail logout if Supabase signOut fails
      }
    }

    // Always clear all auth-related cookies (even if user wasn't authenticated)
    const cookieOptions = {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
      sameSite:
        environment.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
    };

    const cookiesToClear = ["sb-access-token", "sb-refresh-token", "jwt"];
    cookiesToClear.forEach((cookieName) => {
      res.clearCookie(cookieName, cookieOptions);
    });

    console.log("[AUTH CONTROLLER] Auth cookies cleared");

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    console.error("[AUTH CONTROLLER] Logout error:", error);
    // Even if logout fails, we should clear cookies and return success
    // to prevent infinite loops
    const cookieOptions = {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
      sameSite:
        environment.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const),
    };

    const cookiesToClear = ["sb-access-token", "sb-refresh-token", "jwt"];
    cookiesToClear.forEach((cookieName) => {
      res.clearCookie(cookieName, cookieOptions);
    });

    res.status(200).json({
      status: "success",
      message: "Logout completed with errors",
      error: "Some cleanup operations failed but cookies were cleared",
    });
  }
};

// Legacy callback handlers for backward compatibility
export const gitlabCallback = authCallback;
export const githubCallback = authCallback;
