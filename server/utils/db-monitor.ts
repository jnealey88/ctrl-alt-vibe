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
export function createMonitoredRepository<T extends Record<string, any>>(repository: T): T {
  const monitoredRepository = { ...repository };
  
  // Wrap each function in the repository with tracking
  for (const [key, value] of Object.entries(repository)) {
    if (typeof value === 'function') {
      monitoredRepository[key] = async (...args: any[]) => {
        return trackQuery(
          key, // Use the function name as the query name
          () => value.apply(repository, args),
          { functionName: key }
        );
      };
    }
  }
  
  return monitoredRepository;
}

export default {
  trackQuery,
  createMonitoredRepository
};
