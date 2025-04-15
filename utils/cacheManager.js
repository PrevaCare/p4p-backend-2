/**
 * Simple in-memory cache manager
 * This is a lightweight caching solution that can be replaced with Redis in production
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3600 * 1000; // 1 hour in milliseconds
  }

  /**
   * Set a value in the cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  set(key, value, ttl = this.defaultTTL / 1000) {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, {
      value,
      expiry,
    });
    
    // Set up automatic cleanup after TTL
    setTimeout(() => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    }, ttl * 1000);
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found or expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const cachedItem = this.cache.get(key);
    
    // Check if item has expired
    if (cachedItem.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.value;
  }

  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all values from the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists and is not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const cachedItem = this.cache.get(key);
    if (cachedItem.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Create a singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
