'use strict';

const { InvalidCredentialsError, UserNotFoundError } = require('../../domain/errors/DomainError');
const logger = require('../../infrastructure/logger');

/**
 * Use-case: Authenticate a user with email + password and issue a JWT.
 */
class AuthenticateUser {
  /**
   * @param {object} deps
   * @param {import('../../domain/ports/IUserRepository')} deps.userRepository
   * @param {import('../../domain/ports/IPasswordHasher')} deps.passwordHasher
   * @param {import('../../infrastructure/auth/JwtService')} deps.jwtService
   */
  constructor({ userRepository, passwordHasher, jwtService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.jwtService = jwtService;
  }

  /**
   * @param {object} command
   * @param {string} command.email
   * @param {string} command.password
   * @returns {Promise<{accessToken: string, user: import('../../domain/entities/User')}>}
   */
  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Avoid user-enumeration: use generic error
      throw new InvalidCredentialsError();
    }

    const valid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn({ email }, 'Failed login attempt');
      throw new InvalidCredentialsError();
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      status: user.status,
    });

    logger.info({ userId: user.id }, 'User authenticated');
    return { accessToken, user };
  }
}

module.exports = AuthenticateUser;
