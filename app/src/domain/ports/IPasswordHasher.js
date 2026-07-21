'use strict';

/**
 * Port: Password Hasher
 *
 * Abstracts credential hashing so the domain is not coupled to bcrypt.
 *
 * @interface
 */
class IPasswordHasher {
  /**
   * Hash a plain-text password.
   * @param {string} plaintext
   * @returns {Promise<string>} hashed value
   */
  // eslint-disable-next-line no-unused-vars
  async hash(plaintext) {
    throw new Error('IPasswordHasher.hash() not implemented');
  }

  /**
   * Compare a plain-text password against a stored hash.
   * @param {string} plaintext
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async compare(plaintext, hash) {
    throw new Error('IPasswordHasher.compare() not implemented');
  }
}

module.exports = IPasswordHasher;
