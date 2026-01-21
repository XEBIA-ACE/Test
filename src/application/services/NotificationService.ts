import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  CreateNotificationDTO,
  NotificationStatus,
  NotificationPriority
} from '../../domain/models/Notification';
import { INotificationRepository } from '../../domain/interfaces/INotificationRepository';
import { INotificationProvider } from '../../domain/interfaces/INotificationProvider';
import { ICacheService } from '../../domain/interfaces/ICacheService';
import { IMessageQueue } from '../../domain/interfaces/IMessageQueue';
import { logger } from '../../infrastructure/logging/logger';

export class NotificationService {
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly repository: INotificationRepository,
    private readonly providers: Map<string, INotificationProvider>,
    private readonly cache: ICacheService,
    private readonly messageQueue: IMessageQueue
  ) {}

  async createNotification(dto: CreateNotificationDTO): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      type: dto.type,
      recipient: dto.recipient,
      payload: dto.payload,
      status: dto.scheduledAt ? NotificationStatus.PENDING : NotificationStatus.PROCESSING,
      priority: dto.priority || NotificationPriority.MEDIUM,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      scheduledAt: dto.scheduledAt,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.repository.create(notification);
    logger.info({ notificationId: created.id, type: created.type }, 'Notification created');

    // Publish to Kafka for async processing if not scheduled
    if (!dto.scheduledAt) {
      await this.messageQueue.publish('notifications', created);
    }

    return created;
  }

  async sendNotification(notificationId: string): Promise<void> {
    const notification = await this.repository.findById(notificationId);

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (notification.status === NotificationStatus.SENT) {
      logger.warn({ notificationId }, 'Notification already sent');
      return;
    }

    const provider = this.providers.get(notification.type);

    if (!provider) {
      throw new Error(`No provider found for type: ${notification.type}`);
    }

    // Validate recipient before sending
    if (!provider.validateRecipient(notification)) {
      await this.repository.update(notificationId, {
        status: NotificationStatus.FAILED,
        error: 'Invalid recipient',
        failedAt: new Date()
      });
      throw new Error('Invalid recipient');
    }

    // Update status to processing
    await this.repository.update(notificationId, {
      status: NotificationStatus.PROCESSING,
      attempts: notification.attempts + 1
    });

    try {
      const result = await provider.send(notification);

      if (result.success) {
        await this.repository.update(notificationId, {
          status: NotificationStatus.SENT,
          sentAt: new Date()
        });

        // Cache sent notification for quick lookup
        await this.cache.set(`notification:${notificationId}`, notification, 3600);

        logger.info({ notificationId, type: notification.type }, 'Notification sent successfully');
      } else {
        await this.handleFailure(notification, result.error);
      }
    } catch (error) {
      await this.handleFailure(notification, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleFailure(notification: Notification, error: string): Promise<void> {
    const attempts = notification.attempts + 1;

    if (attempts >= notification.maxAttempts) {
      await this.repository.update(notification.id, {
        status: NotificationStatus.FAILED,
        attempts,
        error,
        failedAt: new Date()
      });

      // Send to dead letter queue
      await this.messageQueue.publish('notifications-dlq', {
        ...notification,
        error
      });

      logger.error({ notificationId: notification.id, error }, 'Notification failed permanently');
    } else {
      await this.repository.update(notification.id, {
        status: NotificationStatus.RETRYING,
        attempts,
        error
      });

      // Re-queue for retry with exponential backoff
      setTimeout(async () => {
        await this.messageQueue.publish('notifications', notification);
      }, Math.pow(2, attempts) * 1000);

      logger.warn({ notificationId: notification.id, attempts }, 'Notification retry scheduled');
    }
  }

  async getNotification(id: string): Promise<Notification | null> {
    // Try cache first
    const cached = await this.cache.get<Notification>(`notification:${id}`);
    if (cached) {
      return cached;
    }

    const notification = await this.repository.findById(id);

    if (notification && notification.status === NotificationStatus.SENT) {
      await this.cache.set(`notification:${id}`, notification, 3600);
    }

    return notification;
  }

  async getNotificationsByRecipient(userId: string, limit = 50): Promise<Notification[]> {
    return this.repository.findByRecipient(userId, limit);
  }

  async getNotificationsByStatus(status: NotificationStatus, limit = 100): Promise<Notification[]> {
    return this.repository.findByStatus(status, limit);
  }

  async processScheduledNotifications(): Promise<void> {
    const scheduled = await this.repository.findPendingScheduled();
    const now = new Date();

    for (const notification of scheduled) {
      if (notification.scheduledAt && notification.scheduledAt <= now) {
        await this.messageQueue.publish('notifications', notification);
        await this.repository.update(notification.id, {
          status: NotificationStatus.PROCESSING
        });
      }
    }

    logger.info({ count: scheduled.length }, 'Processed scheduled notifications');
  }
}
