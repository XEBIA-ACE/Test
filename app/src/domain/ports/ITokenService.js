'use strict';

/**
 * ITokenService — outbound port (driven side).
 *
 * Abstracts JWT generation and verification so the domain use-cases
 * remain independent of any specific JWT library.
 */
class ITokenService {
  /**
   * Generate an access token for the given payload.
   *
   * @param {object} payload          - Data to embed in the token
   * @param {string} payload.userId
   * @param {string} payload.email
   * @param {string} payload.role
   * @returns {string} Signed JWT access token
   */
  // eslint-disable-next-line no-unused-vars
  generateAccessToken(payload) {
    throw new Error('ITokenService.generateAccessToken() must be implemented');
  }

  /**
   * Generate a refresh token for the given payload.
   *
   * @param {object} payload
   * @param {string} payload.userId
   * @returns {string} Signed JWT refresh token
   */
  // eslint-disable-next-line no-unused-vars
  generateRefreshToken(payload) {
    throw new Error('ITokenService.generateRefreshToken() must be implemented');
  }

  /**
   * Verify and decode an access token.
   *
   * @param {string} token
   * @returns {{ userId: string, email: string, role: string }} Decoded payload
   * @throws {UnauthorizedError} if the token is invalid or expired
   */
  // eslint-disable-next-line no-unused-vars
  verifyAccessToken(token) {
    throw new Error('ITokenService.verifyAccessToken() must be implemented');
  }

  /**
   * Verify and decode a refresh token.
   *
   * @param {string} token
   * @returns {{ userId: string }} Decoded payload
   * @throws {UnauthorizedError} if the token is invalid or expired
   */
  // eslint-disable-next-line no-unused-vars
  verifyRefreshToken(token) {
    throw new Error('ITokenService.verifyRefreshToken() must be implemented');
  }
}

module.exports = ITokenService;
