'use strict';

/** Base domain error */
class DomainError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   */
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'DOMAIN_ERROR';
    Error.captureStackTrace(this, this.constructor);
  }
}

class UserAlreadyExistsError extends DomainError {
  /** @param {string} identifier */
  constructor(identifier) {
    super(`User already exists: ${identifier}`, 'USER_ALREADY_EXISTS');
    this.statusCode = 409;
  }
}

class UserNotFoundError extends DomainError {
  /** @param {string} identifier */
  constructor(identifier) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
    this.statusCode = 404;
  }
}

class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials', 'INVALID_CREDENTIALS');
    this.statusCode = 401;
  }
}

class ValidationError extends DomainError {
  /**
   * @param {string} message
   * @param {object[]} [details]
   */
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR');
    this.statusCode = 422;
    this.details = details || [];
  }
}

module.exports = {
  DomainError,
  UserAlreadyExistsError,
  UserNotFoundError,
  InvalidCredentialsError,
  ValidationError,
};
