/**
 * Enhanced in-memory cache implementation with tag-based invalidation
 */

interface CacheItem<T> {
  value: T;
  expiry: number | null; // null means no expiration
  tags: Set<string>;
}

export interface CacheOptions {
  ttl?: number; // time to live in milliseconds
  tags?: string[]; // optional tags for cache invalidation
}

class EnhancedCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private tagToKeys: Map<string, Set<string>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default
  private debug: boolean = false;

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param options Cache options
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    const expiry = ttl ? Date.now() + ttl : null;
    const tags = new Set(options.tags || []);
    
    // Store the value with expiry and tags
    this.cache.set(key, {
      value,
      expiry,
      tags
    });
    
    // Add key to tag index
    tags.forEach(tag => {
      if (!this.tagToKeys.has(tag)) {
        this.tagToKeys.set(tag, new Set());
      }
      this.tagToKeys.get(tag)?.add(key);
    });

    if (this.debug) {
      console.log(`[EnhancedCache] Set key: ${key}, tags: ${[...tags].join(', ')}`);
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    if (this.debug) {
      console.log(`[EnhancedCache] Cache hit: ${key}`);
    }
    
    return item.value as T;
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    const item = this.cache.get(key);
    
    if (item) {
      // Remove key from tag indices
      item.tags.forEach(tag => {
        this.tagToKeys.get(tag)?.delete(key);
        
        // Remove tag if no keys are left
        if (this.tagToKeys.get(tag)?.size === 0) {
          this.tagToKeys.delete(tag);
        }
      });
      
      // Remove the key
      this.cache.delete(key);
      
      if (this.debug) {
        console.log(`[EnhancedCache] Deleted key: ${key}`);
      }
    }
  }

  /**
   * Invalidate all cache items with a specific tag
   * @param tag The tag to invalidate
   */
  invalidateTag(tag: string): void {
    const keys = this.tagToKeys.get(tag);
    
    if (keys) {
      if (this.debug) {
        console.log(`[EnhancedCache] Invalidating tag: ${tag}, keys: ${keys.size}`);
      }
      
      // Delete all keys with this tag
      [...keys].forEach(key => this.delete(key));
      
      // Remove the tag
      this.tagToKeys.delete(tag);
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.tagToKeys.clear();
    
    if (this.debug) {
      console.log('[EnhancedCache] Cache cleared');
    }
  }

  /**
   * Set the default TTL for all cache items
   * @param ttl Time to live in milliseconds
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Enable or disable debug logging
   * @param enabled Whether debug logging is enabled
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get the number of tags being tracked
   */
  get tagCount(): number {
    return this.tagToKeys.size;
  }
}

// Export a singleton instance
const enhancedCache = new EnhancedCache();
export default enhancedCache;