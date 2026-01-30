import { Integration, IntegrationStatus } from '../entities/Integration';

/**
 * Integration Repository Interface
 * Defines data access contract following Repository pattern
 */
export interface IIntegrationRepository {
  /**
   * Creates a new integration record
   */
  create(integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration>;

  /**
   * Finds integration by ID
   */
  findById(id: string): Promise<Integration | null>;

  /**
   * Finds all integrations with optional filtering
   */
  findAll(filters?: IntegrationFilters): Promise<Integration[]>;

  /**
   * Updates integration status
   */
  updateStatus(id: string, status: IntegrationStatus, errorMessage?: string): Promise<Integration>;

  /**
   * Updates integration with response data
   */
  updateWithResponse(
    id: string,
    status: IntegrationStatus,
    data?: Record<string, unknown>,
    errorMessage?: string
  ): Promise<Integration>;

  /**
   * Increments retry count
   */
  incrementRetryCount(id: string): Promise<Integration>;

  /**
   * Deletes integration by ID
   */
  delete(id: string): Promise<boolean>;
}

export interface IntegrationFilters {
  sourceSystem?: string;
  targetSystem?: string;
  status?: IntegrationStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
