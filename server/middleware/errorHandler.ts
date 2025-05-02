import { Request, Response, NextFunction } from 'express';
import loggerModule from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  data?: any;
}

/**
 * Centralized error handler middleware for consistent error responses
 * and improved logging for debugging
 */
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  // Determine the appropriate status code
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'UNKNOWN_ERROR';
  
  // Log error with appropriate level based on status code
  if (statusCode >= 500) {
    loggerModule.error(
      `${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`,
      'errorHandler'
    );
  } else {
    loggerModule.warn(
      `${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`,
      'errorHandler'
    );
  }
  
  // Only log full error details (including stack trace) for server errors
  if (statusCode >= 500) {
    console.error(err);
  }
  
  // Format the error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: errorCode,
      status: statusCode
    },
    // Include additional data if available
    ...(err.data && { data: err.data })
  };
  
  // Send the response to the client
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler for all unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (!res.headersSent) {
    const err: AppError = new Error(`Not Found - ${req.originalUrl}`);
    err.status = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    next(err);
  }
}
