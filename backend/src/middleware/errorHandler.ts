// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { environment } from "../config/index.js"; // To check NODE_ENV

// Interface for common error properties (can be expanded)
interface AppError extends Error {
  statusCode?: number;
  status?: string; // 'fail', 'error'
  isOperational?: boolean; // For distinguishing known operational errors
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction // Express error handlers require these four arguments
): void => {
  err.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  err.status = err.status || "error"; // Default status

  // Log the error details for debugging
  // In a production environment, you'd use a more robust logger (Winston, Pino, etc.)
  console.error(`🔴 [ERROR HANDLER] Path: ${req.path}, Method: ${req.method}`);
  console.error(err); // Log the full error object

  // For operational errors we trust (e.g., user input validation), send more details.
  // For programming or unknown errors, send a generic message in production.
  if (environment.nodeEnv === "production") {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or other unknown error: don't leak error details
      res.status(500).json({
        status: "error",
        message:
          "Something went very wrong on our end. Please try again later.",
      });
    }
  } else {
    // In development, send more detailed error information
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err, // Send the full error object
      stack: err.stack, // Send the stack trace
    });
  }
};
