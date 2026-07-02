'use strict';

const { UnauthorizedError } = require('../../../domain/errors/DomainError');

/**
 * authenticate — inbound middleware.
 *
 * Extracts the Bearer token from the Authorization header, verifies it
 * via the injected tokenService, and attaches the decoded payload to
 * `req.user`.
 *
 * @param {import('../../../domain/ports/ITokenService')} tokenService
 * @returns {import('express').RequestHandler}
 */
const authenticate = (tokenService) => (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    req.user = tokenService.verifyAccessToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authenticate;
