'use strict';

const { ValidationError } = require('../errors/DomainError');

/**
 * Email value object.
 * Encapsulates validation and normalisation of an e-mail address.
 * Instances are immutable.
 */
class Email {
  /** @type {RegExp} */
  static #PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * @param {string} value - Raw e-mail string
   * @throws {ValidationError} if the value is not a valid e-mail address
   */
  constructor(value) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError('Email must be a non-empty string');
    }

    const normalised = value.trim().toLowerCase();

    if (!Email.#PATTERN.test(normalised)) {
      throw new ValidationError(`"${value}" is not a valid email address`);
    }

    /** @type {string} */
    this.value = normalised;

    Object.freeze(this);
  }

  /**
   * @param {Email} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof Email && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

module.exports = Email;
