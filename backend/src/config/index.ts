// backend/src/config/index.ts

// Re-export the environment configuration
// This allows other parts of the application to import config from a single place:
// import { environment } from '@/config'; (if you set up baseUrl and paths in tsconfig.json for backend)
// or import { environment } from './config'; (if using relative paths)

export { default as environment } from "./environment.js";

// You can add other configuration exports here later if needed, for example:
// export * from './databaseConfig';
// export * from './loggingConfig';
