import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { ProjectEventType } from '../enums/project-event-type.enum';

/**
 * Port: retrieve user notification preferences.
 * Adapters: in-memory stub, database-backed implementation.
 */
export interface INotificationPreferenceRepository {
  /**
   * Returns the preference for a given user / channel / event-type combination.
   * Returns null when no explicit preference exists (treat as opted-in by default).
   */
  findPreference(
    userId: string,
    channel: NotificationChannel,
    eventType: ProjectEventType,
  ): Promise<NotificationPreference | null>;

  /**
   * Returns all preferences for a given user.
   */
  findAllForUser(userId: string): Promise<NotificationPreference[]>;
}

export const NOTIFICATION_PREFERENCE_REPOSITORY =
  'NOTIFICATION_PREFERENCE_REPOSITORY';
