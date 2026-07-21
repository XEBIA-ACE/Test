'use strict';

const bcrypt = require('bcryptjs');
const IPasswordHasher = require('../../domain/ports/IPasswordHasher');

/**
 * bcryptjs implementation of IPasswordHasher.
 */
class BcryptPasswordHasher extends IPasswordHasher {
  constructor() {
    super();
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  }

  /**
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async hash(plaintext) {
    return bcrypt.hash(plaintext, this.saltRounds);
  }

  /**
   * @param {string} plaintext
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async compare(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  }
}

module.exports = BcryptPasswordHasher;
