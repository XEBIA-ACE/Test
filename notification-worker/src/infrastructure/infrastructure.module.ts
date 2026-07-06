import { Module } from '@nestjs/common';
import {
  EMAIL_DISPATCHER,
  PUSH_DISPATCHER,
  IN_APP_DISPATCHER,
} from '../domain/ports/notification-dispatcher.port';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from '../domain/ports/notification-preference.repository.port';
import { IDEMPOTENCY_STORE } from '../domain/ports/idempotency-store.port';
import { TEMPLATE_RENDERER } from '../domain/ports/template-renderer.port';
import { SendGridEmailDispatcher } from './adapters/email/sendgrid-email.dispatcher';
import { FirebasePushDispatcher } from './adapters/push/firebase-push.dispatcher';
import { InAppNotificationDispatcher } from './adapters/in-app/in-app-notification.dispatcher';
import { InMemoryNotificationPreferenceRepository } from './adapters/preferences/in-memory-preference.repository';
import { InMemoryIdempotencyStore } from './adapters/idempotency/in-memory-idempotency.store';
import { HandlebarsTemplateRenderer } from './adapters/template/handlebars-template.renderer';
import { RabbitMQConsumer } from './adapters/messaging/rabbitmq.consumer';
import { ProcessProjectEventUseCase } from '../application/use-cases/process-project-event.use-case';

@Module({
  providers: [
    { provide: EMAIL_DISPATCHER, useClass: SendGridEmailDispatcher },
    { provide: PUSH_DISPATCHER, useClass: FirebasePushDispatcher },
    { provide: IN_APP_DISPATCHER, useClass: InAppNotificationDispatcher },
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: InMemoryNotificationPreferenceRepository },
    { provide: IDEMPOTENCY_STORE, useClass: InMemoryIdempotencyStore },
    { provide: TEMPLATE_RENDERER, useClass: HandlebarsTemplateRenderer },
    ProcessProjectEventUseCase,
    RabbitMQConsumer,
  ],
  exports: [
    EMAIL_DISPATCHER,
    PUSH_DISPATCHER,
    IN_APP_DISPATCHER,
    NOTIFICATION_PREFERENCE_REPOSITORY,
    IDEMPOTENCY_STORE,
    TEMPLATE_RENDERER,
    ProcessProjectEventUseCase,
  ],
})
export class InfrastructureModule {}
