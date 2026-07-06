import { Test, TestingModule } from '@nestjs/testing';
import { ProcessProjectEventUseCase } from '../../src/application/use-cases/process-project-event.use-case';
import { ProjectEvent } from '../../src/domain/entities/project-event.entity';
import { ProjectEventType } from '../../src/domain/enums/project-event-type.enum';
import { NotificationChannel } from '../../src/domain/enums/notification-channel.enum';
import { NotificationPreference } from '../../src/domain/entities/notification-preference.entity';
import { InMemoryIdempotencyStore } from '../../src/infrastructure/adapters/idempotency/in-memory-idempotency.store';
import { InMemoryNotificationPreferenceRepository } from '../../src/infrastructure/adapters/preferences/in-memory-preference.repository';
import { HandlebarsTemplateRenderer } from '../../src/infrastructure/adapters/template/handlebars-template.renderer';
import {
  EMAIL_DISPATCHER,
  PUSH_DISPATCHER,
  IN_APP_DISPATCHER,
} from '../../src/domain/ports/notification-dispatcher.port';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from '../../src/domain/ports/notification-preference.repository.port';
import { IDEMPOTENCY_STORE } from '../../src/domain/ports/idempotency-store.port';
import { TEMPLATE_RENDERER } from '../../src/domain/ports/template-renderer.port';
import { DuplicateEventError } from '../../src/domain/errors/domain.errors';
import { TransientDeliveryError } from '../../src/domain/errors/domain.errors';

const makeEvent = (overrides: Partial<ConstructorParameters<typeof ProjectEvent>[0]> = {}): ProjectEvent =>
  new ProjectEvent({
    eventId: 'evt-001',
    eventType: ProjectEventType.CREATED,
    occurredAt: new Date().toISOString(),
    projectId: 'proj-001',
    projectName: 'Test Project',
    ...overrides,
  });

describe('ProcessProjectEventUseCase', () => {
  let useCase: ProcessProjectEventUseCase;
  let idempotencyStore: InMemoryIdempotencyStore;
  let preferenceRepo: InMemoryNotificationPreferenceRepository;
  let emailDispatchSpy: jest.Mock;
  let pushDispatchSpy: jest.Mock;
  let inAppDispatchSpy: jest.Mock;

  beforeEach(async () => {
    idempotencyStore = new InMemoryIdempotencyStore();
    preferenceRepo = new InMemoryNotificationPreferenceRepository();
    emailDispatchSpy = jest.fn().mockResolvedValue(undefined);
    pushDispatchSpy = jest.fn().mockResolvedValue(undefined);
    inAppDispatchSpy = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessProjectEventUseCase,
        { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useValue: preferenceRepo },
        { provide: IDEMPOTENCY_STORE, useValue: idempotencyStore },
        { provide: TEMPLATE_RENDERER, useClass: HandlebarsTemplateRenderer },
        { provide: EMAIL_DISPATCHER, useValue: { dispatch: emailDispatchSpy } },
        { provide: PUSH_DISPATCHER, useValue: { dispatch: pushDispatchSpy } },
        { provide: IN_APP_DISPATCHER, useValue: { dispatch: inAppDispatchSpy } },
      ],
    }).compile();

    useCase = module.get<ProcessProjectEventUseCase>(ProcessProjectEventUseCase);
  });

  describe('happy path', () => {
    it('dispatches to all three channels when no preferences are set (default opt-in)', async () => {
      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');

      expect(emailDispatchSpy).toHaveBeenCalledTimes(1);
      expect(pushDispatchSpy).toHaveBeenCalledTimes(1);
      expect(inAppDispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('marks the event as processed after successful execution', async () => {
      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');

      expect(await idempotencyStore.hasBeenProcessed(event.eventId)).toBe(true);
    });

    it('passes the correct recipient address to dispatchers', async () => {
      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'recipient@example.com');

      const emailCall = emailDispatchSpy.mock.calls[0][0];
      expect(emailCall.recipient).toBe('recipient@example.com');
    });
  });

  describe('idempotency', () => {
    it('throws DuplicateEventError when the same event is processed twice', async () => {
      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');

      await expect(useCase.execute(event, 'user-1', 'user@example.com')).rejects.toThrow(
        DuplicateEventError,
      );
    });

    it('does not dispatch again for a duplicate event', async () => {
      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');
      emailDispatchSpy.mockClear();

      await expect(useCase.execute(event, 'user-1', 'user@example.com')).rejects.toThrow(
        DuplicateEventError,
      );
      expect(emailDispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('notification preferences', () => {
    it('skips email channel when user has opted out', async () => {
      preferenceRepo.seed(
        new NotificationPreference({
          userId: 'user-1',
          channel: NotificationChannel.EMAIL,
          eventType: ProjectEventType.CREATED,
          optedIn: false,
        }),
      );

      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');

      expect(emailDispatchSpy).not.toHaveBeenCalled();
      expect(pushDispatchSpy).toHaveBeenCalledTimes(1);
      expect(inAppDispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('dispatches email when user has explicitly opted in', async () => {
      preferenceRepo.seed(
        new NotificationPreference({
          userId: 'user-1',
          channel: NotificationChannel.EMAIL,
          eventType: ProjectEventType.CREATED,
          optedIn: true,
        }),
      );

      const event = makeEvent();
      await useCase.execute(event, 'user-1', 'user@example.com');

      expect(emailDispatchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry logic', () => {
    it('retries on TransientDeliveryError and succeeds on second attempt', async () => {
      emailDispatchSpy
        .mockRejectedValueOnce(new TransientDeliveryError('temporary failure'))
        .mockResolvedValueOnce(undefined);

      const event = makeEvent();
      await expect(useCase.execute(event, 'user-1', 'user@example.com')).resolves.not.toThrow();
      expect(emailDispatchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('template rendering', () => {
    it('renders a non-empty subject for project.created', async () => {
      const event = makeEvent({ eventType: ProjectEventType.CREATED, projectName: 'My Project' });
      await useCase.execute(event, 'user-1', 'user@example.com');

      const emailCall = emailDispatchSpy.mock.calls[0][0];
      expect(emailCall.subject).toContain('My Project');
    });

    it('renders a non-empty subject for project.updated', async () => {
      const event = makeEvent({ eventId: 'evt-002', eventType: ProjectEventType.UPDATED, projectName: 'My Project' });
      await useCase.execute(event, 'user-1', 'user@example.com');

      const emailCall = emailDispatchSpy.mock.calls[0][0];
      expect(emailCall.subject).toContain('My Project');
    });

    it('renders a non-empty subject for project.deleted', async () => {
      const event = makeEvent({ eventId: 'evt-003', eventType: ProjectEventType.DELETED, projectName: 'My Project' });
      await useCase.execute(event, 'user-1', 'user@example.com');

      const emailCall = emailDispatchSpy.mock.calls[0][0];
      expect(emailCall.subject).toContain('My Project');
    });
  });
});
