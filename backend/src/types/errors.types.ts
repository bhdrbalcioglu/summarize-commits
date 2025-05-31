// backend/src/types/errors.types.ts

// RFC 9457 Problem Details for HTTP APIs
export interface ProblemDetails {
  type?: string; // URI reference that identifies the problem type
  title: string; // Short, human-readable summary
  status: number; // HTTP status code
  detail?: string; // Human-readable explanation specific to this occurrence
  instance?: string; // URI reference that identifies the specific occurrence

  // Extension members
  timestamp?: string;
  trace_id?: string;
  user_id?: string;
  request_id?: string;

  // Additional context
  errors?: ValidationError[];
  metadata?: Record<string, any>;
}

// Validation error details
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Application-specific error types
export type AppErrorType =
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "EXTERNAL_SERVICE_ERROR"
  | "DATABASE_ERROR"
  | "RATE_LIMIT_ERROR"
  | "CONFIGURATION_ERROR"
  | "SUPABASE_ERROR"
  | "GITHUB_API_ERROR"
  | "GITLAB_API_ERROR"
  | "OPENAI_API_ERROR";

// Base application error class
export class AppError extends Error {
  public readonly type: AppErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly traceId?: string;
  public readonly userId?: string;
  public readonly metadata?: Record<string, any>;
  title: string;

  constructor(
    type: AppErrorType,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);

    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.metadata = metadata;
    this.title = this.getTitle(); // Initialize title property

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert to simplified error format
  toErrorResponse() {
    return {
      status: "error",
      statusCode: this.statusCode,
      message: this.message,
      type: this.type,
      timestamp: this.timestamp,
      trace_id: this.traceId,
      ...(this.metadata ? { metadata: this.metadata } : {}),
    };
  }

  private getTitle(): string {
    const titles: Record<AppErrorType, string> = {
      AUTHENTICATION_ERROR: "Authentication Failed",
      AUTHORIZATION_ERROR: "Insufficient Permissions",
      VALIDATION_ERROR: "Validation Failed",
      RESOURCE_NOT_FOUND: "Resource Not Found",
      EXTERNAL_SERVICE_ERROR: "External Service Unavailable",
      DATABASE_ERROR: "Database Operation Failed",
      RATE_LIMIT_ERROR: "Rate Limit Exceeded",
      CONFIGURATION_ERROR: "Configuration Error",
      SUPABASE_ERROR: "Supabase Service Error",
      GITHUB_API_ERROR: "GitHub API Error",
      GITLAB_API_ERROR: "GitLab API Error",
      OPENAI_API_ERROR: "OpenAI API Error",
    };

    return titles[this.type] || "Internal Server Error";
  }
}

// Specific error classes
export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication required",
    metadata?: Record<string, any>
  ) {
    super("AUTHENTICATION_ERROR", message, 401, true, metadata);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = "Insufficient permissions",
    metadata?: Record<string, any>
  ) {
    super("AUTHORIZATION_ERROR", message, 403, true, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    errors?: ValidationError[],
    metadata?: Record<string, any>
  ) {
    super("VALIDATION_ERROR", message, 400, true, { ...metadata, errors });
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id?: string, metadata?: Record<string, any>) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super("RESOURCE_NOT_FOUND", message, 404, true, metadata);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    statusCode: number = 502,
    metadata?: Record<string, any>
  ) {
    super(
      "EXTERNAL_SERVICE_ERROR",
      `${service}: ${message}`,
      statusCode,
      true,
      metadata
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super("DATABASE_ERROR", message, 500, true, metadata);
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, windowMs: number, metadata?: Record<string, any>) {
    const message = `Rate limit exceeded: ${limit} requests per ${windowMs}ms`;
    super("RATE_LIMIT_ERROR", message, 429, true, metadata);
  }
}

// Error context for logging and debugging
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  userAgent?: string;
  ipAddress?: string;
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: string;
}

// Error logging levels
export type ErrorLevel = "error" | "warn" | "info" | "debug";

// Error handler configuration
export interface ErrorHandlerConfig {
  includeStackTrace: boolean;
  logLevel: ErrorLevel;
  enableDetailedErrors: boolean;
  enableErrorReporting: boolean;
}
