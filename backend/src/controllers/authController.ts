// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import { URLSearchParams } from "url"; // Built-in Node.js module
import { environment } from "../config/index.js";
import { User, GitProvider, OAuthUserProfile } from "../types/index.js"; // Assuming User, GitProvider, OAuthUserProfile are in types/index.js
import {
  generateToken,
  findOrCreateUserFromOAuth,
  getAppUserByIdAndProvider,
} from "../services/authService.js";
import { UserJwtPayload, AuthSuccessfulResponse } from "../types/index.js";
import {
  exchangeCodeForGitHubToken,
  getGitHubUserProfile,
} from "../services/githubService.js";
import {
  exchangeCodeForGitLabToken,
  getGitLabUserProfile,
} from "../services/gitlabService.js"; // GitLab için de

// --- STUB/PLACEHOLDER Service functions (to be implemented in Phase 4) ---
// These simulate what gitlabService.ts and githubService.ts will do.
// They need to be replaced with actual calls to those services once created.

// NEW or MODIFIED Handler for /login/:provider
export const redirectToProviderHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { provider } = req.params;
  console.log(
    `[AUTH CONTROLLER] redirectToProviderHandler called for provider: ${provider}`
  );

  if (provider === "gitlab") {
    const params = new URLSearchParams({
      client_id: environment.gitlab.clientId,
      redirect_uri: environment.gitlab.redirectUri,
      response_type: "code",
      scope: environment.gitlab.scopes,
    });
    const gitlabOAuthUrl = `https://gitlab.com/oauth/authorize?${params.toString()}`;
    return res.redirect(gitlabOAuthUrl); // Added return
  } else if (provider === "github") {
    const params = new URLSearchParams({
      client_id: environment.github.clientId,
      redirect_uri: environment.github.redirectUri, // This is YOUR backend's callback URI
      scope: environment.github.scopes,
      response_type: "code",
    });
    const githubOAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.redirect(githubOAuthUrl); // Added return
  } else {
    const err = new Error("Unsupported OAuth provider specified.");
    (err as any).statusCode = 400;
    return next(err); // Added return
  }
};
// 2. OAuth Callback Handlers
const handleOAuthCallback = async (
  provider: GitProvider,
  code: string,
  // exchangeCodeFn ve getUserProfileFn parametrelerini kaldıracağız,
  // çünkü artık provider'a göre doğru servis fonksiyonunu doğrudan çağıracağız.
  res: Response,
  next: NextFunction
) => {
  try {
    if (!code) {
      const err = new Error("Authorization code not provided by provider.");
      (err as any).statusCode = 400;
      return next(err);
    }

    let tokenResult: { accessToken: string; [key: string]: any };
    let oauthProfile: OAuthUserProfile;

    if (provider === "github") {
      tokenResult = await exchangeCodeForGitHubToken(code); // GERÇEK SERVİS ÇAĞRISI
      if (!tokenResult || !tokenResult.accessToken) {
        // GitHub'dan token gelmezse
        const err = new Error(
          `Failed to obtain access token from ${provider}.`
        );
        (err as any).statusCode = 500;
        return next(err);
      }
      oauthProfile = await getGitHubUserProfile(tokenResult.accessToken); // GERÇEK SERVİS ÇAĞRISI
    } else if (provider === "gitlab") {
      const gitlabTokenData = await exchangeCodeForGitLabToken(code); // GERÇEK SERVİS ÇAĞRISI
      if (!gitlabTokenData || !gitlabTokenData.accessToken) {
        // GitLab'dan token gelmezse
        const err = new Error(
          `Failed to obtain access token from ${provider}.`
        );
        (err as any).statusCode = 500;
        return next(err);
      }
      tokenResult = { accessToken: gitlabTokenData.accessToken }; // Sadece accessToken'a ihtiyacımız var burada
      oauthProfile = await getGitLabUserProfile(gitlabTokenData.accessToken); // GERÇEK SERVİS ÇAĞRISI
    } else {
      const err = new Error("Unsupported provider in handleOAuthCallback.");
      (err as any).statusCode = 400;
      return next(err);
    }

    // const { accessToken } = tokenResult; // Bu satır artık gereksiz olabilir, zaten tokenResult.accessToken kullandık
    // if (!accessToken) { ... } // Bu kontrol yukarı taşındı

    // ... (findOrCreateUserFromOAuth, generateToken, HttpOnly cookie set etme ve frontend'e redirect etme mantığı AYNI KALACAK) ...
    // ÖNEMLİ: Backend'in frontend'e redirect ettiği URL'i kontrol et.
    // Başarılı olursa /auth/me'ye güveneceği için frontend'e token göndermesine gerek yok.
    // Sadece HttpOnly cookie'yi set etmeli ve frontend'i ana sayfaya veya dashboard'a yönlendirmeli.

    const appUser: User = await findOrCreateUserFromOAuth(
      provider,
      oauthProfile,
      tokenResult.accessToken // Provider token'ını authService'e ilet (güvenli saklama için)
    );

    const jwtPayload: UserJwtPayload = {
      userId: appUser.id, // Backend'deki User ID'si
      providerUserId: oauthProfile.id,
      provider: provider,
      username: appUser.username,
      // providerToken: tokenResult.accessToken // JWT'ye provider token'ını ekleme! (authService halletmeli)
    };
    const appToken = generateToken(jwtPayload);

    res.cookie("jwt", appToken, {
      httpOnly: true,
      secure: environment.nodeEnv === "production", // Production'da HTTPS üzerinden
      sameSite: "lax", // Veya 'strict' CSRF koruması için
      // maxAge: 1000 * 60 * 60 * 24 // Örn: 1 gün (authService'deki expiresIn ile tutarlı olmalı)
    });

    // Frontend'i token veya kullanıcı bilgisi olmadan, sadece başarılı olduğunu bildirecek şekilde yönlendir.
    // Frontend sonra /auth/me çağrısı yapacak.
    res.redirect(`${environment.frontendUrl}/`); // Veya /dashboard, /user vb.
  } catch (error) {
    console.error(`Error during ${provider} OAuth callback:`, error);
    const typedError = error as any;
    const frontendErrorParams = new URLSearchParams({
      error: `OAuth_failed_with_${provider}`,
      message:
        typedError.response?.data?.message ||
        typedError.response?.data?.error_description ||
        typedError.message ||
        "Unknown OAuth error",
    });
    // Bu hata yönlendirmesini de daha genel bir hata sayfasına yapabilirsin.
    res.redirect(
      `${
        environment.frontendUrl
      }/login-failed?${frontendErrorParams.toString()}` // Veya sadece /login
    );
  }
};
export const gitlabCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.query;
  await handleOAuthCallback(
    "gitlab",
    code as string,
    // Artık placeholder fonksiyonları değil, doğrudan handleOAuthCallback hallediyor
    res,
    next
  );
};

export const githubCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.query;
  await handleOAuthCallback(
    "github",
    code as string,
    // Artık placeholder fonksiyonları değil, doğrudan handleOAuthCallback hallediyor
    res,
    next
  );
};
// --- NEW METHOD for /me endpoint ---
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Explicitly type return as Promise<void>
  try {
    if (!req.auth) {
      res // <<< REMOVED 'return'
        .status(401)
        .json({ message: "User not authenticated (no auth payload)." });
      return; // Return void to exit function
    }

    const { userId, provider } = req.auth;
    const user = await getAppUserByIdAndProvider(userId, provider);

    if (!user) {
      res.status(404).json({ message: "User not found." }); // <<< REMOVED 'return'
      return; // Return void to exit function
    }

    res.status(200).json(user); // This sends the response. No explicit return needed from function itself.
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
};

// --- NEW METHOD for /logout endpoint ---
export const logoutUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // For stateless JWTs, logout is primarily a client-side action (deleting the token).
  // The backend can acknowledge the logout request.
  // If you implement a token blocklist (for immediate revocation),
  // you would add logic here to add the token ID (jti claim) to the blocklist.

  // req.auth should be populated by isAuthenticated middleware, confirming user was authenticated
  if (!req.auth) {
    // Should ideally not happen if isAuthenticated is working, but as a safeguard
    res
      .status(400)
      .json({ message: "User was not properly authenticated to log out." });
    return;
  }

  console.log(
    `User logged out: ${req.auth.username} (Provider: ${req.auth.provider}, ID: ${req.auth.userId})`
  );

  // Respond with a success message.
  // The client is responsible for clearing its stored token.
  res
    .status(200)
    .json({ message: "Logout successful. Please clear your token." });
};
