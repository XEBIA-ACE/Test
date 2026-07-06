// Port: CachePort
// Defines the contract for read-through caching.

export const CACHE_PORT = Symbol('CACHE_PORT');

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}
