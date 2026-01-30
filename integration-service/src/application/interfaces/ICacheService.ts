/**
 * Cache Service Interface
 * Abstraction for caching operations (Redis, in-memory)
 */
export interface ICacheService {
  /**
   * Gets a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Sets a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Deletes a value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Checks if a key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clears all cache entries (use with caution)
   */
  clear(): Promise<void>;

  /**
   * Gets multiple values from cache
   */
  mget<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Sets multiple values in cache
   */
  mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void>;
}
