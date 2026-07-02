'use strict';

const { ValidationError } = require('../errors/DomainError');

/**
 * Password value object.
 * Stores a hashed password and enforces minimum strength rules on raw input.
 * Instances are immutable.
 */
class Password {
  /** Minimum length for a raw (plain-text) password */
  static MIN_LENGTH = 8;

  /**
   * Create a Password from an already-hashed string (e.g. loaded from DB).
   *
   * @param {string} hash - bcrypt hash
   * @returns {Password}
   */
  static fromHash(hash) {
    const p = Object.create(Password.prototype);
    p.hash = hash;
    Object.freeze(p);
    return p;
  }

  /**
   * Validate a raw plain-text password and return a Password instance
   * that holds the raw value ready for hashing.
   *
   * NOTE: The caller (use-case) is responsible for hashing via ITokenProvider
   * or a dedicated PasswordHasher port.  This VO only validates strength.
   *
   * @param {string} raw - Plain-text password supplied by the user
   * @returns {Password}
   * @throws {ValidationError}
   */
  static fromRaw(raw) {
    if (typeof raw !== 'string' || raw.length < Password.MIN_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${Password.MIN_LENGTH} characters long`
      );
    }
    if (!/[A-Z]/.test(raw)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(raw)) {
      throw new ValidationError('Password must contain at least one digit');
    }

    const p = Object.create(Password.prototype);
    p.raw = raw;
    p.hash = null;
    Object.freeze(p);
    return p;
  }

  toString() {
    return '[Password]';
  }
}

module.exports = Password;
