// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { environment } from "./config/index.js";
import cookieParser from "cookie-parser"; // Import et

// --- Import Routers ---
import authRoutes from "./routes/authRoutes.js";
import gitlabRoutes from "./routes/gitlabRoutes.js";
import githubRoutes from "./routes/githubRoutes.js"; // For later
import openAIRoutes from "./routes/openAIRoutes.js"; // For later
// --- Initialize Express App ---
const app: Express = express();
const port = environment.port;

// --- Core Middleware ---
app.use(
  cors({
    origin: environment.frontendUrl, // Geliştirme ve production için doğrudan frontendUrl'i kullan
    credentials: true, // Cookie'lerin gönderilip alınabilmesi için BU ÇOK ÖNEMLİ!
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
// Mount specific routers first
app.use("/api/auth", authRoutes);
app.use("/api/gitlab", gitlabRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/openai", openAIRoutes);
// Alternatively, if you have a mainApiRouter that combines these:
// app.use('/api', mainApiRouter);

// A simple health-check/root route for the API (if not handled by a main router)
app.get("/api", (req: Request, res: Response) => {
  res.status(200).json({ message: "Backend API is running successfully!" });
});

// --- Catch-all for 404 API Not Found (if no API routes matched) ---
// This middleware will only be reached if no routes defined above matched.
// It specifically targets /api paths for API 404s.
// ✅ works in Express 5
app.use("/api/*path", (req, res) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// If you were also serving frontend static files and handling client-side routing,
// a more general catch-all to serve index.html would go here, after API 404.
// Example (for later, if needed):
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'path/to/your/frontend/build/index.html'));
// });

// --- Global Error Handler ---
// This should be the VERY LAST middleware added with app.use()
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`🔴 [GLOBAL ERROR HANDLER]: ${err.stack || err}`);
  const isProduction = environment.nodeEnv === "production";
  // Type assertion for statusCode and status on err object
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const message =
    isProduction && statusCode === 500
      ? "An unexpected error occurred on the server."
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(
    `[server]: Backend server is running in ${environment.nodeEnv} mode at http://localhost:${port}`
  );
  console.log(`[server]: Frontend URL configured: ${environment.frontendUrl}`);
  console.log(
    `[server]: GitLab OAuth Redirect URI configured: ${environment.gitlab.redirectUri}`
  );
  console.log(
    `[server]: GitHub OAuth Redirect URI configured: ${environment.github.redirectUri}`
  );
});

export default app;
