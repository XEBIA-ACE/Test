import Redis from 'ioredis';
import { ICacheService } from '../../domain/interfaces/ICacheService';
import { logger } from '../logging/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
}

export class RedisService implements ICacheService {
  private client: Redis;
  private readonly defaultTTL: number;

  constructor(private readonly config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.defaultTTL = config.ttl || 3600;

    this.client.on('connect', () => {
      logger.info({ host: config.host, port: config.port }, 'Redis connected');
    });

    this.client.on('error', (error) => {
      logger.error({ error: error.message }, 'Redis error');
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Error getting value from Redis');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || this.defaultTTL;

      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Error setting value in Redis');
      throw error;
    }
  }

  async setWithExpiry(key: string, value: any, seconds: number): Promise<void> {
    await this.set(key, value, seconds);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Error deleting value from Redis');
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Error checking key existence in Redis');
      return false;
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.client.incr(key);

      // Set TTL only on first increment (when value is 1)
      if (value === 1 && ttl) {
        await this.client.expire(key, ttl);
      }

      return value;
    } catch (error: any) {
      logger.error({ key, error: error.message }, 'Error incrementing value in Redis');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis disconnected');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error disconnecting from Redis');
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}
