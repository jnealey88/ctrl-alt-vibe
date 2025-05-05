/**
 * Simple in-memory cache implementation
 */

interface CacheItem<T> {
  value: T;
  expiry: number | null; // null means no expiration
}

export interface CacheOptions {
  ttl?: number; // time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param options Cache options
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    const expiry = ttl ? Date.now() + ttl : null;
    
    this.cache.set(key, {
      value,
      expiry
    });
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
    
    return item.value as T;
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Set the default TTL for all cache items
   * @param ttl Time to live in milliseconds
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
const cache = new Cache();
export default cache;