import { ProjectEventType } from '../enums/project-event-type.enum';

/**
 * Domain entity representing an inbound project event.
 */
export class ProjectEvent {
  /** Unique event identifier — used for idempotency checks. */
  readonly eventId: string;

  readonly eventType: ProjectEventType;

  /** ISO-8601 timestamp of when the event was emitted. */
  readonly occurredAt: string;

  readonly projectId: string;

  readonly projectName: string;

  /** Arbitrary additional payload from the event. */
  readonly payload: Record<string, unknown>;

  constructor(params: {
    eventId: string;
    eventType: ProjectEventType;
    occurredAt: string;
    projectId: string;
    projectName: string;
    payload?: Record<string, unknown>;
  }) {
    this.eventId = params.eventId;
    this.eventType = params.eventType;
    this.occurredAt = params.occurredAt;
    this.projectId = params.projectId;
    this.projectName = params.projectName;
    this.payload = params.payload ?? {};
  }
}
