import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
  // Set default status code if not provided
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Enhanced error logging with request context
  const errorLog = {
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  
  // Log the structured error with full details
  log(`ERROR: ${JSON.stringify(errorLog)}`, 'error');
  
  // Only expose necessary error details to the client
  const clientError = {
    message,
    code: err.code,
    data: err.data,
  };
  
  // Send the response
  res.status(status).json(clientError);
}

/**
 * 404 Not Found handler for all unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api')) {
    const err: AppError = new Error(`Not Found - ${req.originalUrl}`);
    err.status = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    next(err);
  } else {
    // Let Vite or static file middleware handle non-API routes
    next();
  }
}
