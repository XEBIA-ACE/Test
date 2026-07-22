'use strict';

const jwt = require('jsonwebtoken');

/**
 * Thin wrapper around jsonwebtoken for issuing and verifying JWTs.
 */
class JwtService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * Sign a payload and return a JWT string.
   * @param {object} payload
   * @returns {string}
   */
  sign(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * Verify and decode a JWT string.
   * @param {string} token
   * @returns {object} decoded payload
   * @throws {JsonWebTokenError | TokenExpiredError}
   */
  verify(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = JwtService;
