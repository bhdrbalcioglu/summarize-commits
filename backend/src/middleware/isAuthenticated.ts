// backend/src/middleware/isAuthenticated.ts
import { RequestHandler } from "express";
import { verifyToken } from "../services/authService.js"; // Note .js extension for ESM
import { UserJwtPayload } from "../types/index.js"; // Assuming UserJwtPayload is exported via types/index.js

// Augment Express's Request type to include our custom 'auth' property
// This allows us to safely use req.auth in subsequent middlewares/controllers
// without TypeScript complaining.
declare global {
  namespace Express {
    interface Request {
      auth?: UserJwtPayload; // This will hold the decoded JWT payload
    }
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  let token = req.cookies?.jwt; // Get token from cookies first

  // Fallback to Authorization header if no cookie
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({
      status: "error",
      statusCode: 401,
      message: "Unauthorized: Token not provided in cookie or header.",
    });
    return;
  }

  try {
    const decodedPayload = verifyToken(token);
    req.auth = decodedPayload; // Attach decoded payload to the request object
    next(); // Token is valid, proceed to the next middleware or route handler
  } catch (error: any) {
    // authService.verifyToken throws errors with specific messages
    console.error("[AuthMiddleware] Token verification error:", error.message);

    let httpStatusCode = 403; // Forbidden for invalid/expired tokens once an attempt is made
    let clientMessage = "Forbidden: Invalid or expired token.";

    if (error.message === "Token expired.") {
      // Keep 403 or change to 401 if preferred for expired tokens
      clientMessage = "Forbidden: Token has expired.";
    } else if (error.message.startsWith("Invalid token")) {
      // Use the more specific message from verifyToken if it's "Invalid token: <reason>"
      clientMessage = error.message;
    }
    // For other errors from jwt.verify that aren't handled by our custom messages in verifyToken
    // (e.g., if secret is missing and verifyToken itself throws before jwt.verify is called)
    // we might fall back to a more generic server error if it's a config issue.
    // However, authService.verifyToken should ideally handle "secret missing" before jwt.verify.

    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: clientMessage,
    });
    return;
  }
};
