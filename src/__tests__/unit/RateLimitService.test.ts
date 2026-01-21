import { RateLimitService } from '../../application/services/RateLimitService';
import { ICacheService } from '../../domain/interfaces/ICacheService';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let mockCache: jest.Mocked<ICacheService>;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      increment: jest.fn(),
      setWithExpiry: jest.fn()
    } as jest.Mocked<ICacheService>;

    service = new RateLimitService(mockCache, {
      windowMs: 60000,
      maxRequests: 100
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      mockCache.increment.mockResolvedValue(10);

      const result = await service.checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(90);
      expect(mockCache.increment).toHaveBeenCalledWith('ratelimit:user-123', 60);
    });

    it('should deny request when over limit', async () => {
      mockCache.increment.mockResolvedValue(101);

      const result = await service.checkRateLimit('user-123');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow exactly at the limit', async () => {
      mockCache.increment.mockResolvedValue(100);

      const result = await service.checkRateLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return remaining requests', async () => {
      mockCache.get.mockResolvedValue(50);

      const remaining = await service.getRemainingRequests('user-123');

      expect(remaining).toBe(50);
    });

    it('should return max requests if no key exists', async () => {
      mockCache.get.mockResolvedValue(null);

      const remaining = await service.getRemainingRequests('user-123');

      expect(remaining).toBe(100);
    });
  });

  describe('resetRateLimit', () => {
    it('should delete the rate limit key', async () => {
      mockCache.delete.mockResolvedValue();

      await service.resetRateLimit('user-123');

      expect(mockCache.delete).toHaveBeenCalledWith('ratelimit:user-123');
    });
  });
});
