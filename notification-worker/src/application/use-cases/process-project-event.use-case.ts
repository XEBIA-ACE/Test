import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProjectEvent } from '../../domain/entities/project-event.entity';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import {
  INotificationPreferenceRepository,
  NOTIFICATION_PREFERENCE_REPOSITORY,
} from '../../domain/ports/notification-preference.repository.port';
import {
  INotificationDispatcher,
  EMAIL_DISPATCHER,
  PUSH_DISPATCHER,
  IN_APP_DISPATCHER,
} from '../../domain/ports/notification-dispatcher.port';
import {
  IIdempotencyStore,
  IDEMPOTENCY_STORE,
} from '../../domain/ports/idempotency-store.port';
import {
  ITemplateRenderer,
  TEMPLATE_RENDERER,
} from '../../domain/ports/template-renderer.port';
import {
  DuplicateEventError,
  TransientDeliveryError,
  PermanentDeliveryError,
} from '../../domain/errors/domain.errors';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 200;

@Injectable()
export class ProcessProjectEventUseCase {
  private readonly logger = new Logger(ProcessProjectEventUseCase.name);

  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepo: INotificationPreferenceRepository,

    @Inject(EMAIL_DISPATCHER)
    private readonly emailDispatcher: INotificationDispatcher,

    @Inject(PUSH_DISPATCHER)
    private readonly pushDispatcher: INotificationDispatcher,

    @Inject(IN_APP_DISPATCHER)
    private readonly inAppDispatcher: INotificationDispatcher,

    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,

    @Inject(TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
  ) {}

  async execute(event: ProjectEvent, userId: string, recipientAddress: string): Promise<void> {
    // Idempotency guard
    const alreadyProcessed = await this.idempotencyStore.hasBeenProcessed(event.eventId);
    if (alreadyProcessed) {
      this.logger.warn(`Duplicate event detected, skipping: ${event.eventId}`);
      throw new DuplicateEventError(event.eventId);
    }

    const channels: Array<{ channel: NotificationChannel; dispatcher: INotificationDispatcher }> = [
      { channel: NotificationChannel.EMAIL, dispatcher: this.emailDispatcher },
      { channel: NotificationChannel.PUSH, dispatcher: this.pushDispatcher },
      { channel: NotificationChannel.IN_APP, dispatcher: this.inAppDispatcher },
    ];

    for (const { channel, dispatcher } of channels) {
      const preference = await this.preferenceRepo.findPreference(
        userId,
        channel,
        event.eventType,
      );

      // Default to opted-in when no explicit preference exists
      const optedIn = preference === null ? true : preference.optedIn;
      if (!optedIn) {
        this.logger.debug(`User ${userId} opted out of ${channel} for ${event.eventType}`);
        continue;
      }

      const subject = await this.templateRenderer.renderSubject(event, channel);
      const body = await this.templateRenderer.renderBody(event, channel);

      const notification = new Notification({
        notificationId: uuidv4(),
        userId,
        channel,
        subject,
        body,
        recipient: recipientAddress,
        sourceEventId: event.eventId,
      });

      await this.dispatchWithRetry(dispatcher, notification);
    }

    await this.idempotencyStore.markAsProcessed(event.eventId, event);
    this.logger.log(`Event ${event.eventId} processed successfully for user ${userId}`);
  }

  private async dispatchWithRetry(
    dispatcher: INotificationDispatcher,
    notification: Notification,
    attempt = 0,
  ): Promise<void> {
    try {
      await dispatcher.dispatch(notification);
    } catch (err) {
      if (err instanceof PermanentDeliveryError) {
        this.logger.error(
          `Permanent delivery failure for notification ${notification.notificationId}: ${err.message}`,
        );
        throw err;
      }

      if (err instanceof TransientDeliveryError && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Transient failure (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`,
        );
        await this.sleep(delay);
        return this.dispatchWithRetry(dispatcher, notification, attempt + 1);
      }

      this.logger.error(
        `Max retries exceeded for notification ${notification.notificationId}`,
      );
      throw err;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
