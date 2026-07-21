'use strict';

const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const container = require('../../../container');

const router = Router();
const controller = new AuthController(container);

/**
 * POST /api/v1/auth/login
 * Authenticate with email + password; returns JWT.
 */
router.post('/login', (req, res, next) => controller.login(req, res, next));

/**
 * GET /api/v1/auth/callback
 * OAuth2 / OpenID Connect redirect callback.
 * TODO: Implement PKCE flow with the configured OIDC provider.
 */
router.get('/callback', (req, res) => {
  // TODO: Exchange authorization code for tokens via OIDC provider
  res.status(501).json({ status: 'error', message: 'OAuth2 callback not yet implemented' });
});

module.exports = router;
