// Redis adapter implementing CachePort

import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CachePort } from '../../../domain/ports/cache.port';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  private readonly logger = new Logger(RedisCacheAdapter.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key ${key}: ${err}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key ${key}: ${err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Cache DEL pattern failed for ${pattern}: ${err}`);
    }
  }
}
