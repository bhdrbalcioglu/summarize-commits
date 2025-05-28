// backend/src/services/authService.ts
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import ms from "ms";
import { environment } from "../config/index.js";
import {
  User,
  GitProvider,
  UserJwtPayload,
  OAuthUserProfile,
} from "../types/index.js";

// generateToken - (remains the same as your last version)
export const generateToken = (payload: UserJwtPayload): string => {
  if (!environment.jwt.secret) {
    console.error("🔴 JWT_SECRET is not defined. Cannot generate token.");
    throw new Error("JWT secret is missing, server configuration error.");
  }
  const expiresInSeconds = Math.floor(
    ms(
      environment.jwt.expiresIn as `${number}${
        | "ms"
        | "s"
        | "m"
        | "h"
        | "d"
        | "w"
        | "y"}`
    ) / 1000
  );
  if (isNaN(expiresInSeconds) || expiresInSeconds <= 0) {
    console.error(
      `🔴 Invalid JWT_EXPIRES_IN value: "${environment.jwt.expiresIn}". Could not convert to positive number of seconds.`
    );
    throw new Error(
      "Invalid JWT expiresIn configuration. Must be a valid timespan string like '1d', '7 days', '2h'."
    );
  }
  const options: SignOptions = {
    expiresIn: expiresInSeconds,
  };
  return jwt.sign(payload, environment.jwt.secret as Secret, options);
};

// verifyToken - (remains the same as your last version)
export const verifyToken = (token: string): UserJwtPayload => {
  if (!environment.jwt.secret) {
    console.error("🔴 JWT_SECRET is not defined. Cannot verify token.");
    throw new Error("JWT secret is missing, server configuration error.");
  }
  try {
    const decoded = jwt.verify(
      token,
      environment.jwt.secret as Secret
    ) as UserJwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    const jwtError = error as Error;
    if (jwtError.name === "TokenExpiredError") {
      throw new Error("Token expired.");
    } else if (jwtError.name === "JsonWebTokenError") {
      throw new Error(`Invalid token: ${jwtError.message}`);
    }
    throw new Error("Token verification failed due to an unexpected error.");
  }
};

interface StoredUser extends User {
  // Remove the old providerAccessTokens field since we're now using the fields in User interface
}
const usersStore: StoredUser[] = []; // Basit in-memory store

// findOrCreateUserFromOAuth - Updated to store OAuth tokens
export const findOrCreateUserFromOAuth = async (
  provider: GitProvider,
  oauthProfile: OAuthUserProfile,
  providerAccessToken: string
): Promise<User> => {
  

  let appUser = usersStore.find(
    (u) => u.provider === provider && u.id === oauthProfile.id // ID'ler string veya number olabilir, dikkat!
  );

  if (appUser) {
    // Update existing user with new profile data and token
    appUser.name = oauthProfile.name || oauthProfile.username;
    appUser.avatar_url = oauthProfile.avatar_url || "";
    appUser.email = oauthProfile.email || null;
    appUser.providerAccessToken = providerAccessToken; // Store the OAuth token
    appUser.tokenUpdatedAt = new Date(); // Track when token was updated
    console.log("[AuthService] Updated existing user with new token");
  } else {
    // Create new user with OAuth token
    appUser = {
      id: oauthProfile.id,
      provider: provider,
      username: oauthProfile.username,
      name: oauthProfile.name || oauthProfile.username,
      avatar_url: oauthProfile.avatar_url || "",
      email: oauthProfile.email || null,
      web_url:
        (oauthProfile as any).web_url ||
        (provider === "gitlab"
          ? `https://gitlab.com/${oauthProfile.username}`
          : `https://github.com/${oauthProfile.username}`),
      providerAccessToken: providerAccessToken, // Store the OAuth token
      tokenUpdatedAt: new Date(), // Track when token was created
    };
    usersStore.push(appUser); // Use usersStore instead of MOCK_USER_DB
    console.log("[AuthService] Created new user with OAuth token");
  }

  console.log("[AuthService]: Found or created user:", {
    ...appUser,
    providerAccessToken: appUser.providerAccessToken
      ? "***STORED***"
      : "MISSING",
  });
  return appUser;
};

export const getAppUserByIdAndProvider = async (
  userId: string | number,
  provider: GitProvider
): Promise<User | null> => {
  const user = usersStore.find(
    (u) => String(u.id) === String(userId) && u.provider === provider
  );
  if (!user) {
    return null;
  }
  return user;
};

export const getProviderAccessTokenForUser = async (
  userId: string | number,
  provider: GitProvider
): Promise<string | undefined> => {
  const user = usersStore.find(
    (u) => String(u.id) === String(userId) && u.provider === provider
  );

  if (user && user.providerAccessToken) {
    return user.providerAccessToken;
  }

  return undefined;
};

// ... (getAppUserByIdAndProvider ve generateToken/verifyToken aynı kalabilir)
