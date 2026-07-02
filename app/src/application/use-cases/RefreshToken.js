'use strict';

const { UnauthorizedError } = require('../../domain/errors/DomainError');

/**
 * RefreshToken use-case.
 *
 * Accepts a valid refresh token and issues a new access token.
 */
class RefreshToken {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/ITokenService')}   tokenService
   */
  constructor(userRepository, tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  /**
   * @param {object} dto
   * @param {string} dto.refreshToken
   * @returns {Promise<{ accessToken: string }>}
   * @throws {UnauthorizedError}
   */
  async execute({ refreshToken }) {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }
}

module.exports = RefreshToken;
