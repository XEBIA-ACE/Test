'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

/**
 * Auth router factory.
 *
 * @param {import('../../../application/use-cases/RegisterUser')} registerUser
 * @param {import('../../../application/use-cases/LoginUser')}    loginUser
 * @param {import('../../../application/use-cases/RefreshToken')} refreshToken
 * @returns {import('express').Router}
 */
function createAuthRouter(registerUser, loginUser, refreshToken) {
  const router = Router();

  // ── POST /auth/register ──────────────────────────────────────────────────
  router.post(
    '/register',
    validate([
      body('email').isEmail().withMessage('A valid email is required'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
      body('firstName').notEmpty().withMessage('First name is required'),
      body('lastName').notEmpty().withMessage('Last name is required'),
    ]),
    async (req, res, next) => {
      try {
        const user = await registerUser.execute(req.body);
        return res.status(201).json({ data: user.toPublicProfile() });
      } catch (err) {
        return next(err);
      }
    }
  );

  // ── POST /auth/login ─────────────────────────────────────────────────────
  router.post(
    '/login',
    validate([
      body('email').isEmail().withMessage('A valid email is required'),
      body('password').notEmpty().withMessage('Password is required'),
    ]),
    async (req, res, next) => {
      try {
        const result = await loginUser.execute(req.body);
        return res.status(200).json({ data: result });
      } catch (err) {
        return next(err);
      }
    }
  );

  // ── POST /auth/refresh ───────────────────────────────────────────────────
  router.post(
    '/refresh',
    validate([
      body('refreshToken').notEmpty().withMessage('refreshToken is required'),
    ]),
    async (req, res, next) => {
      try {
        const result = await refreshToken.execute({ refreshToken: req.body.refreshToken });
        return res.status(200).json({ data: result });
      } catch (err) {
        return next(err);
      }
    }
  );

  return router;
}

module.exports = createAuthRouter;
