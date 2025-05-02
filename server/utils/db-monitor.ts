/**
 * Utility for monitoring database performance
 */

import performance from './performance';
import logger from './logger';

/**
 * Wraps database queries with performance tracking
 * @param queryName Name of the query for identification in metrics
 * @param queryFn The database query function to execute
 * @param tags Optional tags to associate with the query
 * @returns The result of the query function
 */
export async function trackQuery<T>(
  queryName: string, 
  queryFn: () => Promise<T>,
  tags: Record<string, string | number | boolean> = {}
): Promise<T> {
  // Start tracking performance
  const endTracking = performance.trackQuery(queryName, tags);
  
  try {
    // Execute the query
    const result = await queryFn();
    
    // End tracking and capture metrics
    const duration = endTracking({
      success: true,
      resultType: result ? typeof result : 'null'
    });
    
    // Log slow queries (threshold is set in performance.ts)
    return result;
  } catch (error: any) {
    // End tracking with error information
    const duration = endTracking({
      success: false,
      error: error.message
    });
    
    // Log database errors
    logger.error(
      `Database query '${queryName}' failed after ${duration.toFixed(2)}ms: ${error.message}`,
      'database'
    );
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Creates a wrapped version of a storage repository that tracks all query performance
 * @param repository The original repository object with database functions
 * @returns A wrapped version of the repository with performance tracking
 */
export function createMonitoredRepository(repository: Record<string, any>): typeof repository {
  // Create a new object with the same prototype
  const monitoredRepository = Object.create(Object.getPrototypeOf(repository));
  
  // Copy all properties
  Object.getOwnPropertyNames(repository).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(repository, key);
    if (descriptor) {
      // If it's a function, wrap it with performance tracking
      if (typeof repository[key] === 'function') {
        monitoredRepository[key] = async (...args: any[]) => {
          return trackQuery(
            key, // Use the function name as the query name
            () => repository[key].apply(repository, args),
            { functionName: key }
          );
        };
      } else {
        // Otherwise just copy the property
        Object.defineProperty(monitoredRepository, key, descriptor);
      }
    }
  });
  
  return monitoredRepository;
}

export default {
  trackQuery,
  createMonitoredRepository
};
