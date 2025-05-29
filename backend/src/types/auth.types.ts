// backend/src/types/auth.types.ts
import { User, GitProvider } from "./git.types.js"; // Import User from your git.types

// Payload that will be encoded into the JWT
// Keep this minimal for security and token size.
// It should be enough to re-identify the user and their provider context.
export interface UserJwtPayload {
  userId: string | number; // Your application's internal user ID, or provider ID if not storing users locally
  providerUserId: string | number; // The user's ID from the specific Git provider
  provider: GitProvider;
  username: string; // Username from the provider, for convenience
  providerToken?: string; // <--- ADD THIS LINE (make it optional)

  // roles?: string[];            // Optional: if you implement roles within your app
}

// What your backend's /auth/<provider>/callback endpoint will send to the frontend
export interface AuthSuccessfulResponse {
  token: string; // Your application's JWT
  user: User; // The User object (as defined in git.types.ts)
  // providerToken?: string; // Optionally send back the provider's access token if frontend needs it for some reason
  // (Generally not recommended if backend proxies all calls)
}

// Structure of user profile data as fetched from an OAuth provider (GitLab/GitHub)
// This is a generic structure; specific services will map to this.
export interface OAuthUserProfile {
  id: string | number;
  username: string; // GitLab: username, GitHub: login
  name: string;
  email?: string | null;
  avatar_url?: string;
  web_url?: string; // URL to user's profile page on the provider platform

  // Common fields available from both providers
  bio?: string | null;
  location?: string | null;
  created_at?: string;
  
  // GitHub-specific fields
  company?: string | null;
  blog?: string | null;
  twitter_username?: string | null;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  updated_at?: string;
  hireable?: boolean | null;
  
  // GitLab-specific fields
  organization?: string | null;
  website_url?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  discord?: string | null;
  public_email?: string | null;
  skype?: string | null;
  job_title?: string | null;
  pronouns?: string | null;
  bot?: boolean;
  last_activity_on?: string;
  last_sign_in_at?: string;
  current_sign_in_at?: string;
  confirmed_at?: string;
  theme_id?: number;
  color_scheme_id?: number;
}
