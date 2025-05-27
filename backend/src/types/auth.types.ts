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

  // Add any other common fields you expect from provider profiles
}
