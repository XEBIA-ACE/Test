'use strict';

/**
 * Base class for all domain-layer errors.
 * Subclasses carry a machine-readable `code` so adapters can map them
 * to the appropriate HTTP status without coupling the domain to HTTP.
 */
class DomainError extends Error {
  /**
   * @param {string} message  - Human-readable description
   * @param {string} code     - Machine-readable error code (SCREAMING_SNAKE_CASE)
   */
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends DomainError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends DomainError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'NOT_FOUND');
  }
}

class ConflictError extends DomainError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'CONFLICT');
  }
}

class UnauthorizedError extends DomainError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends DomainError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'FORBIDDEN');
  }
}

module.exports = {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
};
