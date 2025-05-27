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

const MOCK_USER_DB: User[] = [];

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
  providerAccessTokens?: Partial<Record<GitProvider, string>>; // Provider tokenlarını saklamak için
}
const usersStore: StoredUser[] = []; // Basit in-memory store
// findOrCreateUserFromOAuth - (remains the same as your last version)
export const findOrCreateUserFromOAuth = async (
  provider: GitProvider,
  oauthProfile: OAuthUserProfile,
  providerAccessToken: string
): Promise<User> => {
  console.log(
    `[AuthService] Finding or creating user. Provider: ${provider}, Profile ID: ${
      oauthProfile.id
    }, Token: ${providerAccessToken ? "RECEIVED" : "MISSING"}`
  );
  let appUser = usersStore.find(
    (u) => u.provider === provider && u.id === oauthProfile.id // ID'ler string veya number olabilir, dikkat!
  );
  if (appUser) {
    appUser.name = oauthProfile.name || oauthProfile.username;
    appUser.avatar_url = oauthProfile.avatar_url || "";
    appUser.email = oauthProfile.email || null;
  } else {
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
    };
    MOCK_USER_DB.push(appUser);
  }
  console.log("[AuthService - MOCK]: Found or created user:", appUser);
  return appUser;
};

export const getAppUserByIdAndProvider = async (
  userId: string | number,
  provider: GitProvider
): Promise<User | null> => {
  console.log(
    `[AuthService - MOCK]: Attempting to find user with ID ${userId} for provider ${provider}`
  );
  const user = MOCK_USER_DB.find(
    (u) => String(u.id) === String(userId) && u.provider === provider
  );
  if (!user) {
    console.log(
      `[AuthService - MOCK]: User not found with ID ${userId} for provider ${provider}`
    );
    return null;
  }
  console.log(`[AuthService - MOCK]: Found user:`, user);
  return user;
};
export const getProviderAccessTokenForUser = async (
  userId: string | number, // Bu senin appUser.id'n olmalı
  provider: GitProvider
): Promise<string | undefined> => {
  console.log(
    `[AuthService] Attempting to retrieve ${provider} token for user ID: ${userId}`
  );
  const user = usersStore.find(
    (u) => u.id === userId && u.provider === provider
  ); // Provider'ı da kontrol et
  if (
    user &&
    user.providerAccessTokens &&
    user.providerAccessTokens[provider]
  ) {
    console.log(`[AuthService] Found ${provider} token for user ID: ${userId}`);
    return user.providerAccessTokens[provider];
  }
  console.warn(
    `[AuthService] No ${provider} token found for user ID: ${userId}`
  );
  return undefined;
};
// ... (getAppUserByIdAndProvider ve generateToken/verifyToken aynı kalabilir)
