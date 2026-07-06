import { Injectable, Logger } from '@nestjs/common';
import { INotificationDispatcher } from '../../domain/ports/notification-dispatcher.port';
import { Notification } from '../../domain/entities/notification.entity';

/**
 * Adapter: dispatches push notifications via Firebase Cloud Messaging (FCM).
 *
 * TODO: inject ConfigService and initialise firebase-admin.
 * The stub below logs the notification and simulates a successful send.
 */
@Injectable()
export class FirebasePushDispatcher implements INotificationDispatcher {
  private readonly logger = new Logger(FirebasePushDispatcher.name);

  async dispatch(notification: Notification): Promise<void> {
    this.logger.log(
      `[FCM] Sending push to device token ${notification.recipient} — subject: "${notification.subject}"`,
    );

    // TODO: replace stub with real FCM call:
    // await admin.messaging().send({
    //   token: notification.recipient,
    //   notification: { title: notification.subject, body: notification.body },
    //   data: { notificationId: notification.notificationId },
    // });

    this.logger.log(`[FCM] Push dispatched: ${notification.notificationId}`);
  }
}
