/**
 * Cache manager utility for storing frequently accessed data
 * Uses Node.js in-memory caching to reduce database load
 */

class CacheManager {
  constructor() {
    this.cache = {};
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
    };
  }

  /**
   * Set a value in the cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in seconds (optional)
   */
  set(key, value, ttl = null) {
    const now = Date.now();
    const item = {
      value,
      created: now,
      expiry: ttl ? now + ttl * 1000 : null,
    };

    this.cache[key] = item;
    this.stats.size = Object.keys(this.cache).length;
    return true;
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache[key];
    const now = Date.now();

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if item is expired
    if (item.expiry && item.expiry < now) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (key in this.cache) {
      delete this.cache[key];
      this.stats.size = Object.keys(this.cache).length;
      return true;
    }
    return false;
  }

  /**
   * Clear all values from the cache
   */
  clear() {
    this.cache = {};
    this.stats.size = 0;
    return true;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRatio:
        this.stats.hits + this.stats.misses > 0
          ? this.stats.hits / (this.stats.hits + this.stats.misses)
          : 0,
    };
  }

  /**
   * Wrap a function with caching
   * @param {Function} fn - Function to cache results for
   * @param {string} keyPrefix - Prefix for cache keys
   * @param {number} ttl - TTL in seconds
   * @returns {Function} - Wrapped function with caching
   */
  wrap(fn, keyPrefix, ttl = 600) {
    return async (...args) => {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      const cached = this.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      this.set(key, result, ttl);
      return result;
    };
  }
}

// Export singleton instance
module.exports = new CacheManager();
