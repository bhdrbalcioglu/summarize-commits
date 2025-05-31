import { z } from "zod";

// Environment validation schema using Zod
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  PORT: z.string().transform(Number).default("3001"),

  // Supabase configuration (required)
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // OpenAI configuration (required)
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // OAuth providers (optional - now handled by Supabase Auth)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().optional(),

  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional(),
  GITLAB_REDIRECT_URI: z.string().optional(),

  // Frontend configuration
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  
  // Backend configuration for OAuth redirects
  BACKEND_URL: z.string().url().default("http://localhost:3001"),

  // Legacy JWT (for graceful migration - will be removed)
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("1d"),
});

// Export the inferred type for TypeScript
export type Environment = z.infer<typeof envSchema>;

// Validation function with detailed error reporting
export function validateEnvironment(env: NodeJS.ProcessEnv): Environment {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join(".");
        return `${path}: ${err.message}`;
      });

      console.error("❌ Environment validation failed:");
      missingVars.forEach((msg) => console.error(`  - ${msg}`));

      // In production, fail fast
      if (env.NODE_ENV === "production") {
        console.error("🔴 Exiting due to invalid environment in production");
        process.exit(1);
      }

      // In development, show helpful message
      console.error("\n💡 To fix these issues:");
      console.error("  1. Create a .env file in the backend directory");
      console.error("  2. Add the missing environment variables");
      console.error("  3. Restart the development server\n");

      throw new Error("Environment validation failed");
    }
    throw error;
  }
}

// Helper to check if we're in development mode
export function isDevelopment(env: Environment): boolean {
  return env.NODE_ENV === "development";
}

// Helper to check if we're in production mode
export function isProduction(env: Environment): boolean {
  return env.NODE_ENV === "production";
}
