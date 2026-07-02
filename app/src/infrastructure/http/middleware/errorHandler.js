'use strict';

const {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} = require('../../../domain/errors/DomainError');
const logger = require('../../../config/logger');

/**
 * Map domain error codes to HTTP status codes.
 *
 * @param {DomainError} err
 * @returns {number}
 */
function domainErrorToStatus(err) {
  if (err instanceof ValidationError) return 422;
  if (err instanceof NotFoundError)   return 404;
  if (err instanceof ConflictError)   return 409;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof ForbiddenError)  return 403;
  return 500;
}

/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  if (err instanceof DomainError) {
    const status = domainErrorToStatus(err);
    logger.warn(`[${err.code}] ${err.message}`, { path: req.path, status });
    return res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Express validation errors (express-validator)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
    });
  }

  // Unexpected errors
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  });
};

module.exports = errorHandler;
