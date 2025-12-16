/**
 * Simple in-memory cache for community data
 * In production, consider using Redis
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Set cache entry with TTL
   */
  set(key, value, ttl = this.ttl) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get cache entry if not expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get or set pattern
   */
  async getOrSet(key, fetchFn, ttl = this.ttl) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }
}

module.exports = new CacheService();
