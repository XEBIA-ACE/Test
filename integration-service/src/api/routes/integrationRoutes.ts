import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { validateRequest } from '../middleware/validation';
import { createIntegrationSchema, integrationIdSchema } from '../validators/integrationSchemas';

/**
 * Integration Routes
 * Defines all integration-related endpoints
 */
export const createIntegrationRoutes = (controller: IntegrationController): Router => {
  const router = Router();

  // Create integration
  router.post('/', validateRequest(createIntegrationSchema), controller.createIntegration);

  // Get integration by ID
  router.get('/:id', validateRequest(integrationIdSchema, 'params'), controller.getIntegration);

  // List integrations
  router.get('/', controller.listIntegrations);

  // Process integration
  router.post(
    '/:id/process',
    validateRequest(integrationIdSchema, 'params'),
    controller.processIntegration
  );

  return router;
};
