import { Injectable, Logger } from '@nestjs/common';
import { INotificationDispatcher } from '../../domain/ports/notification-dispatcher.port';
import { Notification } from '../../domain/entities/notification.entity';

/**
 * Adapter: stores in-app notifications.
 *
 * TODO: inject a database repository and persist the notification record.
 */
@Injectable()
export class InAppNotificationDispatcher implements INotificationDispatcher {
  private readonly logger = new Logger(InAppNotificationDispatcher.name);

  async dispatch(notification: Notification): Promise<void> {
    this.logger.log(
      `[InApp] Storing in-app notification for user ${notification.userId} — subject: "${notification.subject}"`,
    );

    // TODO: persist to database / push to WebSocket channel.

    this.logger.log(`[InApp] In-app notification stored: ${notification.notificationId}`);
  }
}
