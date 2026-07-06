import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * Rendered notification ready for dispatch.
 */
export class Notification {
  readonly notificationId: string;

  readonly userId: string;

  readonly channel: NotificationChannel;

  readonly subject: string;

  readonly body: string;

  /** Recipient address (email address or device token). */
  readonly recipient: string;

  /** Source event ID — used for idempotency. */
  readonly sourceEventId: string;

  constructor(params: {
    notificationId: string;
    userId: string;
    channel: NotificationChannel;
    subject: string;
    body: string;
    recipient: string;
    sourceEventId: string;
  }) {
    this.notificationId = params.notificationId;
    this.userId = params.userId;
    this.channel = params.channel;
    this.subject = params.subject;
    this.body = params.body;
    this.recipient = params.recipient;
    this.sourceEventId = params.sourceEventId;
  }
}
