/**
 * Integration Entity - Core domain model
 * Represents an integration request/response in the system
 */
export interface Integration {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  operation: string;
  payload: Record<string, unknown>;
  status: IntegrationStatus;
  requestTimestamp: Date;
  responseTimestamp?: Date;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum IntegrationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

/**
 * Integration request data transfer object
 */
export interface CreateIntegrationRequest {
  sourceSystem: string;
  targetSystem: string;
  operation: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Integration response data transfer object
 */
export interface IntegrationResponse {
  id: string;
  status: IntegrationStatus;
  data?: Record<string, unknown>;
  message?: string;
  timestamp: Date;
}
