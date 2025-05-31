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
const port = environment.PORT;

// --- Core Middleware ---
app.use(
  cors({
    origin: environment.FRONTEND_URL, // Geliştirme ve production için doğrudan FRONTEND_URL'i kullan
    credentials: true, // Cookie'lerin gönderilip alınabilmesi için BU ÇOK ÖNEMLİ!
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure query parameter parsing
app.set("query parser", "extended");

// Enhanced request logging middleware for debugging
if (environment.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/auth")) {
      console.log(`🌐 [REQUEST] ${req.method} ${req.originalUrl}`, {
        originalUrl: req.originalUrl,
        url: req.url,
        path: req.path,
        hasBody: Object.keys(req.body || {}).length > 0,
        hasCookies: Object.keys(req.cookies || {}).length > 0,
        hasQuery: Object.keys(req.query || {}).length > 0,
        queryParams: req.query,
        queryString: req.url.includes("?") ? req.url.split("?")[1] : "none",
        userAgent: req.get("user-agent")?.substring(0, 50) + "...",
        referer: req.get("referer"),
        fullHeaders: req.headers,
      });
    }
    next();
  });
}

// --- API Routes ---
// Debug middleware specifically for auth routes to capture query parameters
app.use("/api/auth", (req, res, next) => {
  if (req.path === "/callback") {
    console.log(`🔍 [AUTH DEBUG] ============= PRE-ROUTE DEBUG =============`);
    console.log(`🔍 [AUTH DEBUG] Raw request inspection:`, {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      query: req.query,
      queryString: req.url.includes("?") ? req.url.split("?")[1] : "none",
      rawQuery: JSON.stringify(req.query, null, 2),
      fullUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      hasQueryInUrl: req.url.includes("?"),
      urlParts: req.url.split("?"),
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

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

// Catch-all for any requests that might be hitting the server
app.use("/*path", (req, res, next) => {
  if (
    req.originalUrl.includes("callback") ||
    req.originalUrl.includes("auth")
  ) {
    console.log(`🔍 [CATCH-ALL] Unmatched request:`, {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      query: req.query,
      queryString: req.url.includes("?") ? req.url.split("?")[1] : "none",
      headers: req.headers,
    });
  }
  next();
});

// --- Catch-all for 404 API Not Found (if no API routes matched) ---
// This middleware will only be reached if no routes defined above matched.
// It specifically targets /api paths for API 404s.
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
  const isProduction = environment.NODE_ENV === "production";
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
    `[server]: Backend server is running in ${environment.NODE_ENV} mode at http://localhost:${environment.PORT}`
  );
  console.log(`[server]: Frontend URL configured: ${environment.FRONTEND_URL}`);

  // OAuth configuration (optional)
  if (environment.GITLAB_REDIRECT_URI) {
    console.log(
      `[server]: GitLab OAuth Redirect URI configured: ${environment.GITLAB_REDIRECT_URI}`
    );
  }
  if (environment.GITHUB_REDIRECT_URI) {
    console.log(
      `[server]: GitHub OAuth Redirect URI configured: ${environment.GITHUB_REDIRECT_URI}`
    );
  }
});

export default app;
