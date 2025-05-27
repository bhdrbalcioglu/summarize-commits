// backend/src/config/environment.ts
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Helper function to get a required environment variable
const getEnvVar = (key: string, _default?: string): string => {
  const value = process.env[key] || _default;
  if (value === undefined) {
    // In a real application, you might want to throw an error immediately
    // if a critical variable is missing and no default is provided.
    console.error(`🔴 Missing crucial environment variable: ${key}`);
    // For now, we'll let it proceed and potentially fail later if the undefined value is used critically.
    // Or, throw new Error(`🔴 Missing crucial environment variable: ${key}`);
    return ""; // Return empty string or handle as per your app's needs if error isn't thrown
  }
  return value;
};

// Helper function to get a required environment variable as a number
const getEnvVarAsNumber = (key: string, _default?: number): number => {
  const valueStr = process.env[key];
  if (valueStr === undefined && _default !== undefined) {
    return _default;
  }
  const value = parseInt(valueStr || "", 10);
  if (isNaN(value) && _default === undefined) {
    console.error(
      `🔴 Environment variable ${key} is not a valid number and no default is provided.`
    );
    // throw new Error(`🔴 Environment variable ${key} is not a valid number and no default is provided.`);
    return 0; // Or handle appropriately
  }
  if (isNaN(value) && _default !== undefined) {
    return _default;
  }
  return value;
};

export const environment = {
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  port: getEnvVarAsNumber("PORT", 3001),

  openaiApiKey: getEnvVar("OPENAI_API_KEY"),

  jwt: {
    secret: getEnvVar(
      "JWT_SECRET",
      "YOUR_DEV_JWT_SECRET_ONLY_FOR_DEV_CHANGE_IT"
    ), // Provide a default for dev, but ensure it's strong
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "1d" as const),
},

  gitlab: {
    clientId: getEnvVar("GITLAB_CLIENT_ID"),
    clientSecret: getEnvVar("GITLAB_CLIENT_SECRET"),
    redirectUri: getEnvVar("GITLAB_REDIRECT_URI"),
    scopes: "read_user read_api read_repository api", // Default scopes, can be moved to .env if they change
  },

  github: {
    clientId: getEnvVar("GITHUB_CLIENT_ID"),
    clientSecret: getEnvVar("GITHUB_CLIENT_SECRET"),
    redirectUri: getEnvVar("GITHUB_REDIRECT_URI"),
    scopes: "repo user:email", // Default scopes
  },

  frontendUrl: getEnvVar("FRONTEND_URL", "http://localhost:5173"),
};

// Basic validation example (can be expanded with Zod, Joi, etc.)
if (!environment.openaiApiKey) {
  console.warn(
    "⚠️ OpenAI API Key (OPENAI_API_KEY) is not set. AI features will not work."
  );
}
if (
  !environment.jwt.secret ||
  (environment.jwt.secret === "YOUR_DEV_JWT_SECRET_ONLY_FOR_DEV_CHANGE_IT" &&
    environment.nodeEnv === "production")
) {
  console.error(
    "🔴 JWT_SECRET is not set or is using the default development secret in production. This is insecure!"
  );
  // process.exit(1); // Optionally exit if critical for production
}
if (
  !environment.gitlab.clientId ||
  !environment.gitlab.clientSecret ||
  !environment.gitlab.redirectUri
) {
  console.warn(
    "⚠️ GitLab OAuth credentials are not fully set. GitLab login may not work."
  );
}
if (
  !environment.github.clientId ||
  !environment.github.clientSecret ||
  !environment.github.redirectUri
) {
  console.warn(
    "⚠️ GitHub OAuth credentials are not fully set. GitHub login may not work."
  );
}

export default environment;
