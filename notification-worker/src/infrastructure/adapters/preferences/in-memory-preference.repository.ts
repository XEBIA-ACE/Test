import { Injectable } from '@nestjs/common';
import { INotificationPreferenceRepository } from '../../domain/ports/notification-preference.repository.port';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import { ProjectEventType } from '../../domain/enums/project-event-type.enum';

/**
 * Adapter: in-memory stub for notification preferences.
 *
 * TODO: replace with a database-backed implementation (e.g. TypeORM / Prisma).
 */
@Injectable()
export class InMemoryNotificationPreferenceRepository
  implements INotificationPreferenceRepository
{
  /** Keyed by `${userId}:${channel}:${eventType}` */
  private readonly store = new Map<string, NotificationPreference>();

  async findPreference(
    userId: string,
    channel: NotificationChannel,
    eventType: ProjectEventType,
  ): Promise<NotificationPreference | null> {
    const key = `${userId}:${channel}:${eventType}`;
    return this.store.get(key) ?? null;
  }

  async findAllForUser(userId: string): Promise<NotificationPreference[]> {
    return Array.from(this.store.values()).filter((p) => p.userId === userId);
  }

  /** Helper for tests / seeding. */
  seed(preference: NotificationPreference): void {
    const key = `${preference.userId}:${preference.channel}:${preference.eventType}`;
    this.store.set(key, preference);
  }
}
