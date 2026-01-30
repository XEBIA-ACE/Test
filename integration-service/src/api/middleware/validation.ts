import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from '../../utils/errors';

/**
 * Request validation middleware
 * Validates request body, params, or query against Joi schema
 */
export const validateRequest = (
  schema: Joi.ObjectSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }

    // Replace request data with validated value
    req[source] = value;
    next();
  };
};
