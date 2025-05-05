/**
 * Utils index file - export all utility functions
 */

// Export basic cache
import basicCache from './cache';

// Export enhanced cache with tag-based invalidation
import enhancedCache from './enhanced-cache';

// Default to the enhanced cache for better functionality
export const cache = enhancedCache;

// But also export the basic cache for specific use cases
export const simpleCache = basicCache;

// Re-export common utilities that are used across the application
export * from './url-metadata';
