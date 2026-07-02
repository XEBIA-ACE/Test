'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');

/**
 * Users router factory.
 *
 * @param {import('../../../application/use-cases/GetUserProfile')}    getUserProfile
 * @param {import('../../../application/use-cases/UpdateUserProfile')} updateUserProfile
 * @param {import('../../../domain/ports/ITokenService')}              tokenService
 * @returns {import('express').Router}
 */
function createUsersRouter(getUserProfile, updateUserProfile, tokenService) {
  const router = Router();

  // All user routes require authentication
  router.use(authenticate(tokenService));

  // ── GET /users/:id ───────────────────────────────────────────────────────
  router.get(
    '/:id',
    validate([param('id').isUUID().withMessage('User id must be a valid UUID')]),
    async (req, res, next) => {
      try {
        const profile = await getUserProfile.execute({
          targetUserId: req.params.id,
          requesterId: req.user.userId,
          requesterRole: req.user.role,
        });
        return res.status(200).json({ data: profile });
      } catch (err) {
        return next(err);
      }
    }
  );

  // ── PATCH /users/:id ─────────────────────────────────────────────────────
  router.patch(
    '/:id',
    validate([
      param('id').isUUID().withMessage('User id must be a valid UUID'),
      body('firstName').optional().notEmpty().withMessage('firstName cannot be blank'),
      body('lastName').optional().notEmpty().withMessage('lastName cannot be blank'),
    ]),
    async (req, res, next) => {
      try {
        const profile = await updateUserProfile.execute({
          targetUserId: req.params.id,
          requesterId: req.user.userId,
          requesterRole: req.user.role,
          ...req.body,
        });
        return res.status(200).json({ data: profile });
      } catch (err) {
        return next(err);
      }
    }
  );

  return router;
}

module.exports = createUsersRouter;
