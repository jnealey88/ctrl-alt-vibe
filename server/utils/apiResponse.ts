/**
 * Utility for standardizing API responses
 */

import logger from './logger';

export type ApiResponseStatus = 'success' | 'error' | 'warning';

export interface ApiResponseOptions {
  message?: string;
  data?: any;
  meta?: Record<string, any>;
  code?: string;
}

export interface ApiResponse<T = any> {
  status: ApiResponseStatus;
  message?: string;
  data?: T;
  code?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

/**
 * Creates a standardized success response
 * @param options - Response options
 */
export function successResponse<T = any>(options: ApiResponseOptions = {}): ApiResponse<T> {
  return {
    status: 'success',
    message: options.message,
    data: options.data,
    meta: options.meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized error response
 * @param options - Response options
 */
export function errorResponse(options: ApiResponseOptions = {}): ApiResponse {
  // Optionally log the error
  if (options.message) {
    logger.error(options.message, 'api-response');
  }
  
  return {
    status: 'error',
    message: options.message || 'An unexpected error occurred',
    data: options.data,
    code: options.code || 'UNKNOWN_ERROR',
    meta: options.meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized warning response
 * @param options - Response options
 */
export function warningResponse<T = any>(options: ApiResponseOptions = {}): ApiResponse<T> {
  // Optionally log the warning
  if (options.message) {
    logger.warn(options.message, 'api-response');
  }
  
  return {
    status: 'warning',
    message: options.message,
    data: options.data,
    code: options.code,
    meta: options.meta,
    timestamp: new Date().toISOString()
  };
}

export default {
  success: successResponse,
  error: errorResponse,
  warning: warningResponse
};
