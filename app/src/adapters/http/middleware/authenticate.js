'use strict';

const JwtService = require('../../../infrastructure/auth/JwtService');

const jwtService = new JwtService();

/**
 * Middleware: verify Bearer JWT and attach decoded payload to req.user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Missing token' });
  }

  try {
    req.user = jwtService.verify(token);
    next();
  } catch {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
