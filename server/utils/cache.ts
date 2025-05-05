/**
 * Simple in-memory cache utility with time-to-live (TTL) support
 */

import logger from './logger';

interface CacheOptions {
  /** Time-to-live in milliseconds, default: 60000 (1 minute) */
  ttl?: number;
  /** Optional tag for debugging and grouping cache entries */
  tag?: string;
}

interface CacheEntry<T> {
  value: T;
  expires: number;
  tag?: string;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60000; // 1 minute default TTL
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (TTL, tags)
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    const tag = options.tag;
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
      tag
    });
    
    logger.debug(
      `Cache set: ${key} (TTL: ${ttl}ms${tag ? `, Tag: ${tag}` : ''})`, 
      'cache'
    );
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    // If entry doesn't exist
    if (!entry) {
      return undefined;
    }
    
    // If entry has expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`, 'cache');
      return undefined;
    }
    
    logger.debug(
      `Cache hit: ${key}${entry.tag ? ` (Tag: ${entry.tag})` : ''}`, 
      'cache'
    );
    return entry.value;
  }
  
  /**
   * Delete a specific cache entry
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`, 'cache');
  }
  
  /**
   * Clear all entries with a specific tag
   * @param tag Tag to clear
   * @returns Number of entries cleared
   */
  clearByTag(tag: string): number {
    let count = 0;
    
    // Using Array.from to avoid iterator issues
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.tag === tag) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      logger.debug(`Cleared ${count} cache entries with tag: ${tag}`, 'cache');
    }
    
    return count;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    logger.debug(`Cache cleared: ${count} entries removed`, 'cache');
  }
  
  /**
   * Get statistics about the cache
   */
  getStats(): { size: number; keys: string[]; tags: Record<string, number> } {
    const tags: Record<string, number> = {};
    const keys: string[] = [];
    
    // Using Array.from to avoid iterator issues
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      keys.push(key);
      
      if (entry.tag) {
        tags[entry.tag] = (tags[entry.tag] || 0) + 1;
      }
    });
    
    return {
      size: this.cache.size,
      keys,
      tags
    };
  }
  
  /**
   * Perform maintenance by removing expired entries
   * @returns Number of expired entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    // Using Array.from to avoid iterator issues
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expires) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      logger.debug(`Cache cleanup: removed ${count} expired entries`, 'cache');
    }
    
    return count;
  }
}

// Export a singleton instance
const cache = new CacheService();

// Run cache cleanup every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

export default cache;
