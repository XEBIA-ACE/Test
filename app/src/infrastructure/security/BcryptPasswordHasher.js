'use strict';

const bcrypt = require('bcryptjs');
const IPasswordHasher = require('../../domain/ports/IPasswordHasher');
const config = require('../../config');

/**
 * BcryptPasswordHasher — driven adapter.
 *
 * Implements IPasswordHasher using bcryptjs.
 *
 * @implements {IPasswordHasher}
 */
class BcryptPasswordHasher extends IPasswordHasher {
  /**
   * @param {number} [saltRounds]
   */
  constructor(saltRounds = config.bcrypt.saltRounds) {
    super();
    this._saltRounds = saltRounds;
  }

  /**
   * @param {string} plainText
   * @returns {Promise<string>}
   */
  async hash(plainText) {
    return bcrypt.hash(plainText, this._saltRounds);
  }

  /**
   * @param {string} plainText
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async compare(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }
}

module.exports = BcryptPasswordHasher;
