import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

/**
 * Health Routes
 * Defines health check endpoints
 */
export const createHealthRoutes = (controller: HealthController): Router => {
  const router = Router();

  router.get('/health', controller.healthCheck);
  router.get('/ready', controller.readinessCheck);
  router.get('/live', controller.livenessCheck);

  return router;
};
