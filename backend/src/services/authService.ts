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
    // Update existing user with enhanced profile data
    appUser.name = oauthProfile.name || oauthProfile.username;
    appUser.avatar_url = oauthProfile.avatar_url || "";
    appUser.email = oauthProfile.email || null;
    appUser.web_url = oauthProfile.web_url || appUser.web_url;
    appUser.providerAccessToken = providerAccessToken;
    appUser.tokenUpdatedAt = new Date();
    
    // Enhanced fields
    appUser.bio = oauthProfile.bio || null;
    appUser.location = oauthProfile.location || null;
    appUser.created_at = oauthProfile.created_at;
    
    // Provider-specific mapping
    if (provider === 'github') {
      appUser.company = oauthProfile.company || null;
      appUser.website_url = oauthProfile.blog || null;
      appUser.twitter_username = oauthProfile.twitter_username || null;
      appUser.public_repos = oauthProfile.public_repos || 0;
      appUser.followers = oauthProfile.followers || 0;
      appUser.following = oauthProfile.following || 0;
      appUser.updated_at = oauthProfile.updated_at;
      appUser.hireable = oauthProfile.hireable;
      
      appUser.provider_metadata = {
        github: {
          public_gists: oauthProfile.public_gists || 0,
          blog: oauthProfile.blog || null,
        }
      };
    } else if (provider === 'gitlab') {
      appUser.company = oauthProfile.organization || null;
      appUser.website_url = oauthProfile.website_url || null;
      appUser.twitter_username = oauthProfile.twitter || null;
      appUser.linkedin = oauthProfile.linkedin || null;
      appUser.discord = oauthProfile.discord || null;
      appUser.public_email = oauthProfile.public_email || null;
      appUser.job_title = oauthProfile.job_title || null;
      appUser.pronouns = oauthProfile.pronouns || null;
      appUser.is_bot = oauthProfile.bot || false;
      appUser.last_activity_on = oauthProfile.last_activity_on;
      
      appUser.provider_metadata = {
        gitlab: {
          theme_id: oauthProfile.theme_id,
          color_scheme_id: oauthProfile.color_scheme_id,
          last_sign_in_at: oauthProfile.last_sign_in_at,
          current_sign_in_at: oauthProfile.current_sign_in_at,
          confirmed_at: oauthProfile.confirmed_at,
        }
      };
    }
    
    console.log("[AuthService] Updated existing user with enhanced profile data");
  } else {
    // Create new user with enhanced profile data
    const baseUser: User = {
      id: oauthProfile.id,
      provider: provider,
      username: oauthProfile.username,
      name: oauthProfile.name || oauthProfile.username,
      avatar_url: oauthProfile.avatar_url || "",
      email: oauthProfile.email || null,
      web_url:
        oauthProfile.web_url ||
        (provider === "gitlab"
          ? `https://gitlab.com/${oauthProfile.username}`
          : `https://github.com/${oauthProfile.username}`),
      providerAccessToken: providerAccessToken,
      tokenUpdatedAt: new Date(),
      
      // Enhanced fields
      bio: oauthProfile.bio || null,
      location: oauthProfile.location || null,
      created_at: oauthProfile.created_at,
    };
    
    // Provider-specific mapping for new users
    if (provider === 'github') {
      baseUser.company = oauthProfile.company || null;
      baseUser.website_url = oauthProfile.blog || null;
      baseUser.twitter_username = oauthProfile.twitter_username || null;
      baseUser.public_repos = oauthProfile.public_repos || 0;
      baseUser.followers = oauthProfile.followers || 0;
      baseUser.following = oauthProfile.following || 0;
      baseUser.updated_at = oauthProfile.updated_at;
      baseUser.hireable = oauthProfile.hireable;
      
      baseUser.provider_metadata = {
        github: {
          public_gists: oauthProfile.public_gists || 0,
          blog: oauthProfile.blog || null,
        }
      };
    } else if (provider === 'gitlab') {
      baseUser.company = oauthProfile.organization || null;
      baseUser.website_url = oauthProfile.website_url || null;
      baseUser.twitter_username = oauthProfile.twitter || null;
      baseUser.linkedin = oauthProfile.linkedin || null;
      baseUser.discord = oauthProfile.discord || null;
      baseUser.public_email = oauthProfile.public_email || null;
      baseUser.job_title = oauthProfile.job_title || null;
      baseUser.pronouns = oauthProfile.pronouns || null;
      baseUser.is_bot = oauthProfile.bot || false;
      baseUser.last_activity_on = oauthProfile.last_activity_on;
      
      baseUser.provider_metadata = {
        gitlab: {
          theme_id: oauthProfile.theme_id,
          color_scheme_id: oauthProfile.color_scheme_id,
          last_sign_in_at: oauthProfile.last_sign_in_at,
          current_sign_in_at: oauthProfile.current_sign_in_at,
          confirmed_at: oauthProfile.confirmed_at,
        }
      };
    }
    
    appUser = baseUser;
    usersStore.push(appUser);
    console.log("[AuthService] Created new user with enhanced profile data");
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
