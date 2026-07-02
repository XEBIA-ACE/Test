'use strict';

const Email = require('../../domain/value-objects/Email');
const { NotFoundError, UnauthorizedError } = require('../../domain/errors/DomainError');

/**
 * LoginUser use-case.
 *
 * Validates credentials and returns a signed access + refresh token pair.
 */
class LoginUser {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IPasswordHasher')} passwordHasher
   * @param {import('../../domain/ports/ITokenService')}   tokenService
   */
  constructor(userRepository, passwordHasher, tokenService) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  /**
   * @param {object} dto
   * @param {string} dto.email
   * @param {string} dto.password
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
   * @throws {ValidationError}   if input is malformed
   * @throws {UnauthorizedError} if credentials are wrong
   */
  async execute({ email, password }) {
    const emailVO = new Email(email);

    const user = await this.userRepository.findByEmail(emailVO.value);
    if (!user) {
      // Use a generic message to avoid user enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const passwordMatch = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.tokenService.generateRefreshToken({ userId: user.id });

    return {
      accessToken,
      refreshToken,
      user: user.toPublicProfile(),
    };
  }
}

module.exports = LoginUser;
