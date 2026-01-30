import { StatusCodes } from 'http-status-codes';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, StatusCodes.BAD_REQUEST, true, code || 'VALIDATION_ERROR');
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, StatusCodes.NOT_FOUND, true, code || 'NOT_FOUND');
  }
}

/**
 * Unauthorized error for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, StatusCodes.UNAUTHORIZED, true, code || 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, StatusCodes.FORBIDDEN, true, code || 'FORBIDDEN');
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, StatusCodes.CONFLICT, true, code || 'CONFLICT');
  }
}

/**
 * Integration error for external service failures
 */
export class IntegrationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, StatusCodes.BAD_GATEWAY, true, code || 'INTEGRATION_ERROR');
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', code?: string) {
    super(message, StatusCodes.SERVICE_UNAVAILABLE, true, code || 'SERVICE_UNAVAILABLE');
  }
}
