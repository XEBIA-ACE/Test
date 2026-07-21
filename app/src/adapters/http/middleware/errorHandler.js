'use strict';

const { DomainError } = require('../../../domain/errors/DomainError');
const logger = require('../../../infrastructure/logger');

/**
 * Global Express error handler.
 * Maps domain errors to appropriate HTTP responses.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof DomainError) {
    const statusCode = err.statusCode || 400;
    logger.warn({ err: { message: err.message, code: err.code }, requestId: req.requestId }, 'Domain error');
    return res.status(statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected errors — log full stack
  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
