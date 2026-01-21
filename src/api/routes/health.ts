import { Router, Request, Response } from 'express';
import { DatabaseConnection } from '../../infrastructure/database/connection';
import { RedisService } from '../../infrastructure/cache/RedisService';
import { KafkaService } from '../../infrastructure/messaging/KafkaService';

export const createHealthRouter = (
  db: DatabaseConnection,
  redis: RedisService,
  kafka: KafkaService
): Router => {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Basic health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  router.get('/', async (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'notification-service'
    });
  });

  /**
   * @swagger
   * /health/detailed:
   *   get:
   *     summary: Detailed health check with dependencies
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Detailed health status
   */
  router.get('/detailed', async (req: Request, res: Response) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'notification-service',
      dependencies: {
        database: 'unknown',
        redis: 'unknown',
        kafka: 'unknown'
      }
    };

    try {
      const dbHealth = await db.healthCheck();
      health.dependencies.database = dbHealth ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.dependencies.database = 'unhealthy';
    }

    try {
      const redisHealth = await redis.healthCheck();
      health.dependencies.redis = redisHealth ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.dependencies.redis = 'unhealthy';
    }

    try {
      health.dependencies.kafka = kafka.isConnected() ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.dependencies.kafka = 'unhealthy';
    }

    const allHealthy = Object.values(health.dependencies).every((status) => status === 'healthy');
    health.status = allHealthy ? 'ok' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  });

  /**
   * @swagger
   * /health/metrics:
   *   get:
   *     summary: Application metrics
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Application metrics
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();

    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
      },
      cpu: process.cpuUsage(),
      nodejs: process.version,
      platform: process.platform
    });
  });

  return router;
};
