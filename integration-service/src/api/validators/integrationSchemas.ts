import Joi from 'joi';

/**
 * Validation schemas for integration endpoints
 */

export const createIntegrationSchema = Joi.object({
  sourceSystem: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Source system is required',
    'any.required': 'Source system is required',
  }),
  targetSystem: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Target system is required',
    'any.required': 'Target system is required',
  }),
  operation: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Operation is required',
    'any.required': 'Operation is required',
  }),
  payload: Joi.object().required().messages({
    'object.base': 'Payload must be an object',
    'any.required': 'Payload is required',
  }),
  metadata: Joi.object().optional(),
});

export const integrationIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid integration ID format',
    'any.required': 'Integration ID is required',
  }),
});

export const listIntegrationsSchema = Joi.object({
  sourceSystem: Joi.string().optional(),
  targetSystem: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
  offset: Joi.number().integer().min(0).default(0).optional(),
});
