// backend/src/config/environment.ts
import dotenv from "dotenv";
import { validateEnvironment, type Environment } from "./envSchema.js";

// Load environment variables from .env file
dotenv.config();

// Validate and parse environment variables
export const environment: Environment = validateEnvironment(process.env);

// Freeze the environment object to prevent accidental mutations
Object.freeze(environment);

// Log configuration status (non-sensitive info only)
if (environment.NODE_ENV === "development") {
  console.log("🔧 Environment Configuration:");
  console.log(`  - Node Environment: ${environment.NODE_ENV}`);
  console.log(`  - Port: ${environment.PORT}`);
  console.log(`  - Frontend URL: ${environment.FRONTEND_URL}`);
  console.log(`  - Backend URL: ${environment.BACKEND_URL}`);
  console.log(`  - Supabase URL: ${environment.SUPABASE_URL}`);
  console.log(`  - OpenAI API Key: ${environment.OPENAI_API_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`  - Supabase Keys: ${environment.SUPABASE_ANON_KEY && environment.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"}`);
  
  // Legacy OAuth (optional)
  if (environment.GITHUB_CLIENT_ID) {
    console.log(`  - GitHub OAuth: ✅ Configured`);
  }
  if (environment.GITLAB_CLIENT_ID) {
    console.log(`  - GitLab OAuth: ✅ Configured`);
  }
}

export default environment;
