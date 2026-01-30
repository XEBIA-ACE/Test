import { v4 as uuidv4 } from 'uuid';
import { IIntegrationRepository } from '../../domain/repositories/IIntegrationRepository';
import {
  Integration,
  IntegrationStatus,
  CreateIntegrationRequest,
  IntegrationResponse,
} from '../../domain/entities/Integration';
import { IMessageBroker } from '../interfaces/IMessageBroker';
import { ICacheService } from '../interfaces/ICacheService';
import { IExternalApiClient } from '../interfaces/IExternalApiClient';
import { Logger } from '../../utils/logger';
import { NotFoundError, ValidationError } from '../../utils/errors';

/**
 * Integration Service - Core business logic
 * Orchestrates integration operations following SOLID principles
 */
export class IntegrationService {
  private readonly logger: Logger;

  constructor(
    private readonly integrationRepository: IIntegrationRepository,
    private readonly messageBroker: IMessageBroker,
    private readonly cacheService: ICacheService,
    private readonly externalApiClient: IExternalApiClient
  ) {
    this.logger = new Logger({ service: 'IntegrationService' });
  }

  /**
   * Creates a new integration request
   */
  async createIntegration(request: CreateIntegrationRequest): Promise<Integration> {
    this.logger.info('Creating new integration', { request });

    // Validate request
    this.validateIntegrationRequest(request);

    // Create integration entity
    const integration = await this.integrationRepository.create({
      sourceSystem: request.sourceSystem,
      targetSystem: request.targetSystem,
      operation: request.operation,
      payload: request.payload,
      status: IntegrationStatus.PENDING,
      requestTimestamp: new Date(),
      metadata: request.metadata,
      retryCount: 0,
    });

    // Publish to message broker for async processing
    await this.messageBroker.publish('integration.requests', {
      integrationId: integration.id,
      ...request,
    });

    this.logger.info('Integration created successfully', { integrationId: integration.id });

    return integration;
  }

  /**
   * Processes an integration request
   */
  async processIntegration(integrationId: string): Promise<IntegrationResponse> {
    this.logger.info('Processing integration', { integrationId });

    const integration = await this.integrationRepository.findById(integrationId);
    if (!integration) {
      throw new NotFoundError(`Integration not found: ${integrationId}`);
    }

    try {
      // Update status to processing
      await this.integrationRepository.updateStatus(integrationId, IntegrationStatus.PROCESSING);

      // Execute integration based on target system
      const response = await this.executeIntegration(integration);

      // Update with success response
      await this.integrationRepository.updateWithResponse(
        integrationId,
        IntegrationStatus.COMPLETED,
        response
      );

      // Cache the result
      await this.cacheService.set(`integration:${integrationId}`, response, 3600);

      // Publish success event
      await this.messageBroker.publish('integration.events', {
        integrationId,
        status: 'COMPLETED',
        timestamp: new Date(),
      });

      this.logger.info('Integration processed successfully', { integrationId });

      return {
        id: integrationId,
        status: IntegrationStatus.COMPLETED,
        data: response,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Integration processing failed', { integrationId, error });

      // Handle retry logic
      const updatedIntegration = await this.handleIntegrationError(integration, error as Error);

      return {
        id: integrationId,
        status: updatedIntegration.status,
        message: updatedIntegration.errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Retrieves integration by ID (with caching)
   */
  async getIntegration(id: string): Promise<Integration> {
    // Check cache first
    const cached = await this.cacheService.get<Integration>(`integration:${id}`);
    if (cached) {
      this.logger.debug('Integration retrieved from cache', { id });
      return cached;
    }

    const integration = await this.integrationRepository.findById(id);
    if (!integration) {
      throw new NotFoundError(`Integration not found: ${id}`);
    }

    // Cache the result
    await this.cacheService.set(`integration:${id}`, integration, 300);

    return integration;
  }

  /**
   * Lists integrations with filtering
   */
  async listIntegrations(filters?: any): Promise<Integration[]> {
    this.logger.info('Listing integrations', { filters });
    return this.integrationRepository.findAll(filters);
  }

  /**
   * Validates integration request
   */
  private validateIntegrationRequest(request: CreateIntegrationRequest): void {
    if (!request.sourceSystem || !request.targetSystem) {
      throw new ValidationError('Source and target systems are required');
    }

    if (!request.operation) {
      throw new ValidationError('Operation is required');
    }

    if (!request.payload || Object.keys(request.payload).length === 0) {
      throw new ValidationError('Payload is required');
    }
  }

  /**
   * Executes integration based on target system
   */
  private async executeIntegration(
    integration: Integration
  ): Promise<Record<string, unknown>> {
    const { targetSystem, operation, payload } = integration;

    // Route to appropriate integration adapter
    switch (targetSystem.toLowerCase()) {
      case 'rest-api':
        return this.externalApiClient.call({
          method: operation,
          endpoint: '/api/endpoint',
          data: payload,
        });

      case 'soap-service':
        // SOAP integration would be handled here
        return this.externalApiClient.call({
          method: 'POST',
          endpoint: '/soap/service',
          data: payload,
          headers: { 'Content-Type': 'text/xml' },
        });

      default:
        throw new ValidationError(`Unsupported target system: ${targetSystem}`);
    }
  }

  /**
   * Handles integration errors with retry logic
   */
  private async handleIntegrationError(
    integration: Integration,
    error: Error
  ): Promise<Integration> {
    const maxRetries = 3;

    if (integration.retryCount < maxRetries) {
      // Increment retry count
      const updated = await this.integrationRepository.incrementRetryCount(integration.id);
      await this.integrationRepository.updateStatus(
        integration.id,
        IntegrationStatus.RETRYING,
        error.message
      );

      // Re-publish for retry
      await this.messageBroker.publish('integration.requests', {
        integrationId: integration.id,
        retry: true,
      });

      return updated;
    } else {
      // Max retries reached, mark as failed
      return this.integrationRepository.updateStatus(
        integration.id,
        IntegrationStatus.FAILED,
        error.message
      );
    }
  }
}
