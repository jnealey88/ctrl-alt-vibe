/**
 * Enhanced cache utility with tag-based invalidation
 * This extends the existing cache functionality with additional features like tag-based invalidation
 */

import cache from './cache';

interface CacheOptions {
  ttl?: number;     // Time to live in milliseconds
  tag?: string;     // Tag for grouping related cache entries
  tags?: string[];  // Multiple tags for this entry
}

/**
 * Set a value in the cache with expiration and tags
 * @param key Cache key
 * @param value Value to cache
 * @param options Caching options (ttl, tag, tags)
 */
function set(key: string, value: any, options: CacheOptions = {}): void {
  // Store the value with the existing cache mechanism
  cache.set(key, value, { ttl: options.ttl });
  
  // Store tag metadata
  if (options.tag) {
    storeTagMapping(key, options.tag);
  }
  
  if (options.tags && options.tags.length > 0) {
    options.tags.forEach(tag => storeTagMapping(key, tag));
  }
}

/**
 * Get a value from the cache
 * @param key Cache key
 * @returns Cached value or undefined if not found/expired
 */
function get(key: string): any {
  return cache.get(key);
}

/**
 * Invalidate all cache entries with a specific tag
 * @param tag Tag to invalidate
 */
function invalidateByTag(tag: string): void {
  const keys = getKeysByTag(tag);
  keys.forEach(key => cache.delete(key));
  clearTagMapping(tag);
}

/**
 * Delete a specific cache entry
 * @param key Cache key to delete
 */
function deleteKey(key: string): void {
  cache.delete(key);
  removeKeyFromAllTags(key);
}

/**
 * Clear the entire cache
 */
function clear(): void {
  cache.clear();
  clearAllTagMappings();
}

// Tag mapping storage (in-memory)
// In a production system, this would be persisted (e.g., Redis)
const tagMappings: Map<string, Set<string>> = new Map();

// Helper to store tag->keys mapping
function storeTagMapping(key: string, tag: string): void {
  if (!tagMappings.has(tag)) {
    tagMappings.set(tag, new Set());
  }
  tagMappings.get(tag)!.add(key);
}

// Helper to get keys by tag
function getKeysByTag(tag: string): string[] {
  return Array.from(tagMappings.get(tag) || []);
}

// Helper to clear a tag mapping
function clearTagMapping(tag: string): void {
  tagMappings.delete(tag);
}

// Helper to clear all tag mappings
function clearAllTagMappings(): void {
  tagMappings.clear();
}

// Helper to remove a key from all tag mappings
function removeKeyFromAllTags(key: string): void {
  tagMappings.forEach((keys, tag) => {
    if (keys.has(key)) {
      keys.delete(key);
      if (keys.size === 0) {
        tagMappings.delete(tag);
      }
    }
  });
}

// Export the enhanced cache
export default {
  set,
  get,
  invalidateByTag,
  delete: deleteKey,
  clear
};
