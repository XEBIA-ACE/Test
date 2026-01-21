import { ICacheService } from '../../domain/interfaces/ICacheService';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimitService {
  constructor(
    private readonly cache: ICacheService,
    private readonly config: RateLimitConfig
  ) {}

  async checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${identifier}`;
    const windowSeconds = Math.floor(this.config.windowMs / 1000);

    const current = await this.cache.increment(key, windowSeconds);

    const allowed = current <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - current);

    return { allowed, remaining };
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const key = `ratelimit:${identifier}`;
    const current = await this.cache.get<number>(key);

    if (!current) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - current);
  }

  async resetRateLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await this.cache.delete(key);
  }
}
