/**
 * Utility for standardizing API responses
 */

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
    code: options.code,
    meta: options.meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized error response
 * @param options - Response options
 */
export function errorResponse(options: ApiResponseOptions = {}): ApiResponse {
  return {
    status: 'error',
    message: options.message || 'An error occurred',
    data: options.data,
    code: options.code || 'ERROR',
    meta: options.meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized warning response
 * @param options - Response options
 */
export function warningResponse<T = any>(options: ApiResponseOptions = {}): ApiResponse<T> {
  return {
    status: 'warning',
    message: options.message || 'Warning',
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
