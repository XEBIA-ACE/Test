import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../utils/logger';

/**
 * Health Controller
 * Handles health check and readiness endpoints
 */
export class HealthController {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({ controller: 'HealthController' });
  }

  /**
   * Health check endpoint
   * GET /health
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json({
      status: 'healthy',
      service: 'integration-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };

  /**
   * Readiness check endpoint
   * GET /ready
   */
  readinessCheck = async (req: Request, res: Response): Promise<void> => {
    // Check dependencies (database, redis, kafka, etc.)
    const checks = {
      database: true, // Implement actual check
      redis: true, // Implement actual check
      kafka: true, // Implement actual check
    };

    const isReady = Object.values(checks).every((check) => check);

    res.status(isReady ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
      status: isReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Liveness check endpoint
   * GET /live
   */
  livenessCheck = async (req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  };
}
