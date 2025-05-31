// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { environment } from "../config/index.js";
import {
  ProblemDetails,
  AppError as CustomAppError,
  ValidationError as CustomValidationError,
  ErrorContext,
  AppErrorType,
} from "../types/errors.types.js";
import analyticsService from "../services/analyticsService.js";

/**
 * Enhanced global error handler implementing RFC 9457 Problem Details
 * with analytics integration and structured logging
 */
export const globalErrorHandler = async (
  err: Error | CustomAppError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const traceId = uuidv4();
  const timestamp = new Date().toISOString();
  const isProduction = environment.NODE_ENV === "production";

  // Create error context for logging and analytics
  const errorContext: ErrorContext = {
    userId: req.auth?.userId ? String(req.auth.userId) : undefined,
    sessionId: (req.headers["x-session-id"] as string) || undefined,
    requestId: (req.headers["x-request-id"] as string) || undefined,
    traceId,
    userAgent: req.headers["user-agent"] || undefined,
    ipAddress: req.ip || req.connection.remoteAddress || undefined,
    method: req.method,
    url: req.originalUrl,
    body: req.method !== "GET" ? req.body : undefined,
    headers: {
      authorization: req.headers.authorization || "Bearer ***",
      "content-type": req.headers["content-type"] || "",
      "user-agent": req.headers["user-agent"] || "",
    },
    timestamp,
  };

  // Determine if this is an operational error (CustomAppError) or programming error
  const isAppError = err instanceof CustomAppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorType: AppErrorType = isAppError ? err.type : "DATABASE_ERROR";

  // Simplified error response for debugging
  const errorResponse = {
    status: "error",
    statusCode: statusCode,
    message: isProduction && !isAppError
        ? "An unexpected error occurred. Please contact support with the trace ID."
        : err.message,
    timestamp,
    trace_id: traceId,
    ...(isAppError && err.metadata ? { metadata: err.metadata } : {})
  };

  // Log error with context
  console.error(`🔴 [ERROR HANDLER] ${errorType}:`, {
    error: {
      name: err.name,
      message: err.message,
      stack: !isProduction ? err.stack : undefined,
      type: errorType,
      operational: isAppError ? err.isOperational : false,
    },
    context: errorContext,
    errorResponse,
  });

  // Track error analytics (non-blocking)
  if (req.auth?.userId) {
    try {
      await analyticsService.trackEvent({
        event_type: "error_occurred",
        user_id: String(req.auth.userId),
        metadata: {
          error_type: errorType,
          status_code: statusCode,
          path: req.originalUrl,
          method: req.method,
          trace_id: traceId,
          is_operational: isAppError ? err.isOperational : false,
          provider: req.auth.provider,
          user_agent: req.headers["user-agent"],
        },
      });
    } catch (analyticsError) {
      console.error(
        "🟡 [ERROR HANDLER] Failed to track error analytics:",
        analyticsError
      );
    }
  }

  // Set response headers
  res.setHeader("X-Trace-Id", traceId);
  res.setHeader("Content-Type", "application/json");

  // Send simplified error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Express error handler for async routes
 * Wraps async route handlers to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 errors for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new CustomAppError(
    "RESOURCE_NOT_FOUND",
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    true,
    {
      method: req.method,
      path: req.originalUrl,
      available_routes: [
        "GET /api/health",
        "GET /api/auth/me",
        "POST /api/auth/logout",
        "GET /api/github/organizations",
        "GET /api/gitlab/groups",
      ],
    }
  );
  next(error);
};

/**
 * Validation error helper
 */
export const createValidationError = (
  message: string,
  field: string,
  value?: any
) => {
  return new CustomAppError("VALIDATION_ERROR", message, 400, true, {
    validation_errors: [
      {
        field,
        message,
        value,
      },
    ],
  });
};

/**
 * External service error helper
 */
export const createServiceError = (
  service: "github" | "gitlab" | "openai" | "supabase",
  originalError: any,
  statusCode: number = 502
) => {
  const errorType: AppErrorType =
    service === "github"
      ? "GITHUB_API_ERROR"
      : service === "gitlab"
      ? "GITLAB_API_ERROR"
      : service === "openai"
      ? "OPENAI_API_ERROR"
      : "SUPABASE_ERROR";

  return new CustomAppError(
    errorType,
    `${service} service error: ${originalError.message || "Unknown error"}`,
    statusCode,
    true,
    {
      service,
      original_status: originalError.status,
      original_code: originalError.code,
      rate_limit: originalError.headers?.["x-ratelimit-remaining"],
    }
  );
};
