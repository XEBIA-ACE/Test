import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../../application/services/RateLimitService';
import { logger } from '../../infrastructure/logging/logger';

export const rateLimitMiddleware = (rateLimitService: RateLimitService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as identifier, or userId if authenticated
      const identifier = req.ip || 'unknown';

      const { allowed, remaining } = await rateLimitService.checkRateLimit(identifier);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitService['config'].maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (!allowed) {
        logger.warn({ identifier }, 'Rate limit exceeded');

        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
      }

      next();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Rate limit middleware error');
      next();
    }
  };
};
