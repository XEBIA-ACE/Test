import { NotificationChannel } from '../enums/notification-channel.enum';
import { ProjectEventType } from '../enums/project-event-type.enum';

/**
 * Per-user notification preference for a specific channel + event type combination.
 */
export class NotificationPreference {
  readonly userId: string;

  readonly channel: NotificationChannel;

  readonly eventType: ProjectEventType;

  /** Whether the user has opted in to receive this notification. */
  readonly optedIn: boolean;

  constructor(params: {
    userId: string;
    channel: NotificationChannel;
    eventType: ProjectEventType;
    optedIn: boolean;
  }) {
    this.userId = params.userId;
    this.channel = params.channel;
    this.eventType = params.eventType;
    this.optedIn = params.optedIn;
  }
}
