import { IntegrationService } from '../../../src/application/services/IntegrationService';
import { IIntegrationRepository } from '../../../src/domain/repositories/IIntegrationRepository';
import { IMessageBroker } from '../../../src/application/interfaces/IMessageBroker';
import { ICacheService } from '../../../src/application/interfaces/ICacheService';
import { IExternalApiClient } from '../../../src/application/interfaces/IExternalApiClient';
import { Integration, IntegrationStatus } from '../../../src/domain/entities/Integration';
import { NotFoundError, ValidationError } from '../../../src/utils/errors';

/**
 * Integration Service Unit Tests
 */
describe('IntegrationService', () => {
  let integrationService: IntegrationService;
  let mockRepository: jest.Mocked<IIntegrationRepository>;
  let mockMessageBroker: jest.Mocked<IMessageBroker>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockApiClient: jest.Mocked<IExternalApiClient>;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      updateWithResponse: jest.fn(),
      incrementRetryCount: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockMessageBroker = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
    } as any;

    mockApiClient = {
      call: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Create service instance
    integrationService = new IntegrationService(
      mockRepository,
      mockMessageBroker,
      mockCacheService,
      mockApiClient
    );
  });

  describe('createIntegration', () => {
    it('should create a new integration successfully', async () => {
      const request = {
        sourceSystem: 'CRM',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: { orderId: '123' },
      };

      const mockIntegration: Integration = {
        id: 'test-id',
        ...request,
        status: IntegrationStatus.PENDING,
        requestTimestamp: new Date(),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockIntegration);
      mockMessageBroker.publish.mockResolvedValue();

      const result = await integrationService.createIntegration(request);

      expect(result).toEqual(mockIntegration);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceSystem: request.sourceSystem,
          targetSystem: request.targetSystem,
          operation: request.operation,
          payload: request.payload,
          status: IntegrationStatus.PENDING,
        })
      );
      expect(mockMessageBroker.publish).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid request', async () => {
      const invalidRequest = {
        sourceSystem: '',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: {},
      };

      await expect(integrationService.createIntegration(invalidRequest)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError for missing payload', async () => {
      const invalidRequest = {
        sourceSystem: 'CRM',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: {},
      };

      await expect(integrationService.createIntegration(invalidRequest)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getIntegration', () => {
    it('should return integration from cache if available', async () => {
      const mockIntegration: Integration = {
        id: 'test-id',
        sourceSystem: 'CRM',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: { orderId: '123' },
        status: IntegrationStatus.COMPLETED,
        requestTimestamp: new Date(),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.get.mockResolvedValue(mockIntegration);

      const result = await integrationService.getIntegration('test-id');

      expect(result).toEqual(mockIntegration);
      expect(mockCacheService.get).toHaveBeenCalledWith('integration:test-id');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from repository if not in cache', async () => {
      const mockIntegration: Integration = {
        id: 'test-id',
        sourceSystem: 'CRM',
        targetSystem: 'ERP',
        operation: 'createOrder',
        payload: { orderId: '123' },
        status: IntegrationStatus.COMPLETED,
        requestTimestamp: new Date(),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(mockIntegration);

      const result = await integrationService.getIntegration('test-id');

      expect(result).toEqual(mockIntegration);
      expect(mockRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCacheService.set).toHaveBeenCalledWith('integration:test-id', mockIntegration, 300);
    });

    it('should throw NotFoundError if integration does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(null);

      await expect(integrationService.getIntegration('nonexistent-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('listIntegrations', () => {
    it('should return list of integrations', async () => {
      const mockIntegrations: Integration[] = [
        {
          id: 'test-id-1',
          sourceSystem: 'CRM',
          targetSystem: 'ERP',
          operation: 'createOrder',
          payload: { orderId: '123' },
          status: IntegrationStatus.COMPLETED,
          requestTimestamp: new Date(),
          retryCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockIntegrations);

      const result = await integrationService.listIntegrations();

      expect(result).toEqual(mockIntegrations);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should pass filters to repository', async () => {
      const filters = {
        sourceSystem: 'CRM',
        status: IntegrationStatus.COMPLETED,
      };

      mockRepository.findAll.mockResolvedValue([]);

      await integrationService.listIntegrations(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });
});
