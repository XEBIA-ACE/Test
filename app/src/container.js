'use strict';

/**
 * Composition root — wires together ports, adapters, and use-cases.
 *
 * This is the only place where concrete implementations are chosen.
 * Swap adapters here (e.g. InMemory → Postgres) without touching domain code.
 */

const PostgresUserRepository = require('./adapters/persistence/PostgresUserRepository');
const InMemoryUserRepository = require('./adapters/persistence/InMemoryUserRepository');
const BcryptPasswordHasher = require('./adapters/security/BcryptPasswordHasher');
const RabbitMQNotificationService = require('./adapters/messaging/RabbitMQNotificationService');
const NoopNotificationService = require('./adapters/messaging/NoopNotificationService');
const JwtService = require('./infrastructure/auth/JwtService');

const RegisterUser = require('./application/usecases/RegisterUser');
const GetUser = require('./application/usecases/GetUser');
const AuthenticateUser = require('./application/usecases/AuthenticateUser');

// ─── Select adapters based on environment ────────────────────────────────────
const isTest = process.env.NODE_ENV === 'test';

const userRepository = isTest
  ? new InMemoryUserRepository()
  : new PostgresUserRepository();

const notificationService = isTest
  ? new NoopNotificationService()
  : (() => {
      try {
        const { getChannel } = require('./infrastructure/messaging/connection');
        return new RabbitMQNotificationService(getChannel());
      } catch {
        return new NoopNotificationService();
      }
    })();

const passwordHasher = new BcryptPasswordHasher();
const jwtService = new JwtService();

// ─── Use-cases ────────────────────────────────────────────────────────────────
const registerUser = new RegisterUser({ userRepository, passwordHasher, notificationService });
const getUser = new GetUser({ userRepository });
const authenticateUser = new AuthenticateUser({ userRepository, passwordHasher, jwtService });

module.exports = {
  userRepository,
  passwordHasher,
  notificationService,
  jwtService,
  registerUser,
  getUser,
  authenticateUser,
};
