'use strict';

const jwt = require('jsonwebtoken');
const ITokenService = require('../../domain/ports/ITokenService');
const { UnauthorizedError } = require('../../domain/errors/DomainError');
const config = require('../../config');

/**
 * JwtTokenService — driven adapter.
 *
 * Implements ITokenService using the `jsonwebtoken` library.
 *
 * @implements {ITokenService}
 */
class JwtTokenService extends ITokenService {
  /**
   * @param {string} [accessSecret]
   * @param {string} [accessExpiresIn]
   * @param {string} [refreshSecret]
   * @param {string} [refreshExpiresIn]
   */
  constructor(
    accessSecret = config.jwt.secret,
    accessExpiresIn = config.jwt.expiresIn,
    refreshSecret = config.jwt.refreshSecret,
    refreshExpiresIn = config.jwt.refreshExpiresIn
  ) {
    super();
    this._accessSecret = accessSecret;
    this._accessExpiresIn = accessExpiresIn;
    this._refreshSecret = refreshSecret;
    this._refreshExpiresIn = refreshExpiresIn;
  }

  /**
   * @param {{ userId: string, email: string, role: string }} payload
   * @returns {string}
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this._accessSecret, { expiresIn: this._accessExpiresIn });
  }

  /**
   * @param {{ userId: string }} payload
   * @returns {string}
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this._refreshSecret, { expiresIn: this._refreshExpiresIn });
  }

  /**
   * @param {string} token
   * @returns {{ userId: string, email: string, role: string }}
   * @throws {UnauthorizedError}
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this._accessSecret);
    } catch (err) {
      throw new UnauthorizedError(`Invalid access token: ${err.message}`);
    }
  }

  /**
   * @param {string} token
   * @returns {{ userId: string }}
   * @throws {UnauthorizedError}
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this._refreshSecret);
    } catch (err) {
      throw new UnauthorizedError(`Invalid refresh token: ${err.message}`);
    }
  }
}

module.exports = JwtTokenService;
