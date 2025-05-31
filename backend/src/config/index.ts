// backend/src/config/index.ts

export { environment } from "./environment.js";

// Export Supabase clients and utilities
export {
  getSupabaseClient,
  getServiceRoleClient,
  getAnonClient,
  createUserClient,
  testSupabaseConnection,
  type Database,
} from "./supabase.js";

// Export environment schema utilities
export {
  validateEnvironment,
  isDevelopment,
  isProduction,
  type Environment,
} from "./envSchema.js";
