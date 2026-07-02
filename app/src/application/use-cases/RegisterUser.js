'use strict';

const User = require('../../domain/entities/User');
const Email = require('../../domain/value-objects/Email');
const Password = require('../../domain/value-objects/Password');
const { ConflictError } = require('../../domain/errors/DomainError');

/**
 * RegisterUser use-case.
 *
 * Orchestrates the creation of a new user account.
 * Depends on IUserRepository and IPasswordHasher ports — injected via constructor.
 */
class RegisterUser {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IPasswordHasher')} passwordHasher
   */
  constructor(userRepository, passwordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * Execute the use-case.
   *
   * @param {object} dto
   * @param {string} dto.email
   * @param {string} dto.password
   * @param {string} dto.firstName
   * @param {string} dto.lastName
   * @returns {Promise<import('../../domain/entities/User')>} The newly created user
   * @throws {ValidationError}  if input is invalid
   * @throws {ConflictError}    if the e-mail is already registered
   */
  async execute({ email, password, firstName, lastName }) {
    // Validate value objects (throws ValidationError on bad input)
    const emailVO = new Email(email);
    const passwordVO = Password.fromRaw(password);

    // Check uniqueness
    const existing = await this.userRepository.findByEmail(emailVO.value);
    if (existing) {
      throw new ConflictError(`Email "${emailVO.value}" is already registered`);
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(passwordVO.raw);

    // Build and persist entity
    const user = new User({
      email: emailVO.value,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    return this.userRepository.save(user);
  }
}

module.exports = RegisterUser;
