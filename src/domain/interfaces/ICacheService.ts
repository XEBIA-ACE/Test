export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, ttl?: number): Promise<number>;
  setWithExpiry(key: string, value: any, seconds: number): Promise<void>;
}
