'use strict';

const express = require('express');

// ── Infrastructure adapters ──────────────────────────────────────────────────
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const JwtTokenService = require('../security/JwtTokenService');
const BcryptPasswordHasher = require('../security/BcryptPasswordHasher');

// ── Application use-cases ────────────────────────────────────────────────────
const RegisterUser = require('../../application/use-cases/RegisterUser');
const LoginUser = require('../../application/use-cases/LoginUser');
const GetUserProfile = require('../../application/use-cases/GetUserProfile');
const UpdateUserProfile = require('../../application/use-cases/UpdateUserProfile');
const RefreshToken = require('../../application/use-cases/RefreshToken');

// ── HTTP layer ───────────────────────────────────────────────────────────────
const createHealthRouter = require('./routes/health.routes');
const createAuthRouter = require('./routes/auth.routes');
const createUsersRouter = require('./routes/users.routes');
const errorHandler = require('./middleware/errorHandler');

/**
 * Build and configure the Express application.
 *
 * Wires together all adapters, use-cases, and routes following the
 * hexagonal architecture pattern.  The app is returned without starting
 * the HTTP server so it can be imported cleanly in tests.
 *
 * @returns {import('express').Application}
 */
function createApp() {
  // ── Compose adapters ───────────────────────────────────────────────────────
  const userRepository = new InMemoryUserRepository();
  const tokenService = new JwtTokenService();
  const passwordHasher = new BcryptPasswordHasher();

  // ── Compose use-cases ──────────────────────────────────────────────────────
  const registerUser = new RegisterUser(userRepository, passwordHasher);
  const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);
  const getUserProfile = new GetUserProfile(userRepository);
  const updateUserProfile = new UpdateUserProfile(userRepository);
  const refreshToken = new RefreshToken(userRepository, tokenService);

  // ── Express setup ──────────────────────────────────────────────────────────
  const app = express();

  app.use(express.json());
  app.disable('x-powered-by');

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use('/health', createHealthRouter());
  app.use('/auth', createAuthRouter(registerUser, loginUser, refreshToken));
  app.use('/users', createUsersRouter(getUserProfile, updateUserProfile, tokenService));

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Global error handler (must be last) ────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
