'use strict';

const User = require('../../domain/entities/User');
const {
  UserAlreadyExistsError,
  ValidationError,
} = require('../../domain/errors/DomainError');
const logger = require('../../infrastructure/logger');

/**
 * Use-case: Register a new user account.
 *
 * Orchestrates:
 *  1. Input validation
 *  2. Uniqueness check (email + mobile)
 *  3. Password hashing
 *  4. Persistence
 *  5. Notification dispatch
 */
class RegisterUser {
  /**
   * @param {object} deps
   * @param {import('../../domain/ports/IUserRepository')} deps.userRepository
   * @param {import('../../domain/ports/IPasswordHasher')} deps.passwordHasher
   * @param {import('../../domain/ports/INotificationService')} deps.notificationService
   */
  constructor({ userRepository, passwordHasher, notificationService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.notificationService = notificationService;
  }

  /**
   * Execute the registration use-case.
   *
   * @param {object} command
   * @param {string} command.email
   * @param {string} command.password
   * @param {string} [command.mobile]
   * @param {string} [command.firstName]
   * @param {string} [command.lastName]
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async execute({ email, password, mobile, firstName, lastName }) {
    // 1. Basic validation
    if (!email || !password) {
      throw new ValidationError('email and password are required');
    }

    // 2. Uniqueness — email
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsError(email);
    }

    // 3. Uniqueness — mobile (if provided)
    if (mobile) {
      const existingMobile = await this.userRepository.findByMobile(mobile);
      if (existingMobile) {
        throw new UserAlreadyExistsError(mobile);
      }
    }

    // 4. Hash password
    const passwordHash = await this.passwordHasher.hash(password);

    // 5. Build aggregate
    const user = new User({
      email,
      mobile,
      passwordHash,
      firstName,
      lastName,
    });

    // 6. Persist
    const saved = await this.userRepository.save(user);

    // 7. Dispatch notification (fire-and-forget — do not fail registration)
    this.notificationService
      .sendRegistrationEmail({ userId: saved.id, email: saved.email, firstName: saved.firstName })
      .catch((err) => logger.error({ err, userId: saved.id }, 'Failed to send registration email'));

    if (mobile) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.notificationService
        .sendVerificationSms({ userId: saved.id, mobile, verificationCode })
        .catch((err) => logger.error({ err, userId: saved.id }, 'Failed to send verification SMS'));
    }

    logger.info({ userId: saved.id, email: saved.email }, 'User registered');
    return saved;
  }
}

module.exports = RegisterUser;
