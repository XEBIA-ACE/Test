import { NotificationService } from '../../application/services/NotificationService';
import { INotificationRepository } from '../../domain/interfaces/INotificationRepository';
import { ICacheService } from '../../domain/interfaces/ICacheService';
import { IMessageQueue } from '../../domain/interfaces/IMessageQueue';
import { INotificationProvider } from '../../domain/interfaces/INotificationProvider';
import {
  CreateNotificationDTO,
  NotificationType,
  NotificationStatus,
  NotificationPriority
} from '../../domain/models/Notification';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let mockCache: jest.Mocked<ICacheService>;
  let mockMessageQueue: jest.Mocked<IMessageQueue>;
  let mockProviders: Map<string, jest.Mocked<INotificationProvider>>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByRecipient: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPendingScheduled: jest.fn()
    } as jest.Mocked<INotificationRepository>;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      increment: jest.fn(),
      setWithExpiry: jest.fn()
    } as jest.Mocked<ICacheService>;

    mockMessageQueue = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    } as jest.Mocked<IMessageQueue>;

    const mockProvider = {
      send: jest.fn(),
      validateRecipient: jest.fn()
    } as jest.Mocked<INotificationProvider>;

    mockProviders = new Map();
    mockProviders.set(NotificationType.EMAIL, mockProvider);

    service = new NotificationService(mockRepository, mockProviders, mockCache, mockMessageQueue);
  });

  describe('createNotification', () => {
    it('should create a notification and publish to message queue', async () => {
      const dto: CreateNotificationDTO = {
        type: NotificationType.EMAIL,
        recipient: { email: 'test@example.com' },
        payload: { subject: 'Test', body: 'Test body' },
        priority: NotificationPriority.MEDIUM
      };

      const expectedNotification = {
        id: 'test-id',
        ...dto,
        status: NotificationStatus.PROCESSING,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.create.mockResolvedValue(expectedNotification);
      mockMessageQueue.publish.mockResolvedValue();

      const result = await service.createNotification(dto);

      expect(result).toEqual(expectedNotification);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockMessageQueue.publish).toHaveBeenCalledWith('notifications', expectedNotification);
    });

    it('should not publish to queue if notification is scheduled', async () => {
      const scheduledAt = new Date(Date.now() + 3600000);
      const dto: CreateNotificationDTO = {
        type: NotificationType.EMAIL,
        recipient: { email: 'test@example.com' },
        payload: { body: 'Test body' },
        scheduledAt
      };

      const expectedNotification = {
        id: 'test-id',
        ...dto,
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.MEDIUM,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.create.mockResolvedValue(expectedNotification);

      await service.createNotification(dto);

      expect(mockMessageQueue.publish).not.toHaveBeenCalled();
    });
  });

  describe('getNotification', () => {
    it('should return cached notification if available', async () => {
      const cachedNotification = {
        id: 'test-id',
        type: NotificationType.EMAIL,
        status: NotificationStatus.SENT,
        recipient: { email: 'test@example.com' },
        payload: { body: 'Test' },
        priority: NotificationPriority.MEDIUM,
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get.mockResolvedValue(cachedNotification);

      const result = await service.getNotification('test-id');

      expect(result).toEqual(cachedNotification);
      expect(mockCache.get).toHaveBeenCalledWith('notification:test-id');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from repository if not cached', async () => {
      const notification = {
        id: 'test-id',
        type: NotificationType.EMAIL,
        status: NotificationStatus.SENT,
        recipient: { email: 'test@example.com' },
        payload: { body: 'Test' },
        priority: NotificationPriority.MEDIUM,
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(notification);

      const result = await service.getNotification('test-id');

      expect(result).toEqual(notification);
      expect(mockRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCache.set).toHaveBeenCalledWith('notification:test-id', notification, 3600);
    });
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const notification = {
        id: 'test-id',
        type: NotificationType.EMAIL,
        status: NotificationStatus.PROCESSING,
        recipient: { email: 'test@example.com' },
        payload: { body: 'Test' },
        priority: NotificationPriority.MEDIUM,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.findById.mockResolvedValue(notification);
      mockRepository.update.mockResolvedValue({ ...notification, status: NotificationStatus.SENT });

      const mockProvider = mockProviders.get(NotificationType.EMAIL)!;
      mockProvider.validateRecipient.mockReturnValue(true);
      mockProvider.send.mockResolvedValue({ success: true, messageId: 'msg-123' });

      await service.sendNotification('test-id');

      expect(mockProvider.send).toHaveBeenCalledWith(notification);
      expect(mockRepository.update).toHaveBeenCalledWith('test-id', {
        status: NotificationStatus.SENT,
        sentAt: expect.any(Date)
      });
    });

    it('should throw error if notification not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.sendNotification('test-id')).rejects.toThrow('Notification test-id not found');
    });
  });
});
