'use strict';

/**
 * IPasswordHasher — outbound port (driven side).
 *
 * Abstracts password hashing so the domain use-cases are not coupled
 * to bcrypt or any other hashing library.
 */
class IPasswordHasher {
  /**
   * Hash a plain-text password.
   *
   * @param {string} plainText
   * @returns {Promise<string>} bcrypt (or equivalent) hash
   */
  // eslint-disable-next-line no-unused-vars
  async hash(plainText) {
    throw new Error('IPasswordHasher.hash() must be implemented');
  }

  /**
   * Compare a plain-text password against a stored hash.
   *
   * @param {string} plainText
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async compare(plainText, hash) {
    throw new Error('IPasswordHasher.compare() must be implemented');
  }
}

module.exports = IPasswordHasher;
