import { Injectable, Logger } from '@nestjs/common';
import { INotificationDispatcher } from '../../domain/ports/notification-dispatcher.port';
import { Notification } from '../../domain/entities/notification.entity';
import { TransientDeliveryError } from '../../domain/errors/domain.errors';

/**
 * Adapter: dispatches email notifications via SendGrid.
 *
 * TODO: inject ConfigService and initialise the @sendgrid/mail client.
 * The stub below logs the notification and simulates a successful send.
 */
@Injectable()
export class SendGridEmailDispatcher implements INotificationDispatcher {
  private readonly logger = new Logger(SendGridEmailDispatcher.name);

  async dispatch(notification: Notification): Promise<void> {
    this.logger.log(
      `[SendGrid] Sending email to ${notification.recipient} — subject: "${notification.subject}"`,
    );

    // TODO: replace stub with real SendGrid call:
    // await sgMail.send({
    //   to: notification.recipient,
    //   from: { email: fromEmail, name: fromName },
    //   subject: notification.subject,
    //   html: notification.body,
    //   customArgs: { notificationId: notification.notificationId },
    // });

    this.logger.log(`[SendGrid] Email dispatched: ${notification.notificationId}`);
  }
}
