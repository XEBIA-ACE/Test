import Redis from 'ioredis';
import { ICacheService } from '../../application/interfaces/ICacheService';
import { Logger } from '../../utils/logger';
import { config } from '../../config/environment';

/**
 * Redis Cache Service Implementation
 * Provides caching using Redis
 */
export class RedisCacheService implements ICacheService {
  private client: Redis;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({ service: 'RedisCacheService' });
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error('Error getting value from cache', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || config.redis.ttl;

      await this.client.setex(key, ttlSeconds, serialized);
      this.logger.debug('Value cached successfully', { key, ttl: ttlSeconds });
    } catch (error) {
      this.logger.error('Error setting value in cache', { key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error('Error deleting value from cache', { key, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Error checking key existence', { key, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.warn('Cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache', error);
      throw error;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(...keys);
      return values.map((value) => (value ? (JSON.parse(value) as T) : null));
    } catch (error) {
      this.logger.error('Error getting multiple values from cache', { keys, error });
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.client.pipeline();

      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value);
        const ttl = entry.ttl || config.redis.ttl;
        pipeline.setex(entry.key, ttl, serialized);
      }

      await pipeline.exec();
      this.logger.debug('Multiple values cached successfully', { count: entries.length });
    } catch (error) {
      this.logger.error('Error setting multiple values in cache', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.logger.info('Redis disconnected');
  }
}
