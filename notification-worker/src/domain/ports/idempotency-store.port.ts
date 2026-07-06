import { ProjectEvent } from '../entities/project-event.entity';

/**
 * Port: check and record processed event IDs for idempotency.
 */
export interface IIdempotencyStore {
  /**
   * Returns true if the event has already been processed.
   */
  hasBeenProcessed(eventId: string): Promise<boolean>;

  /**
   * Marks the event as processed.
   */
  markAsProcessed(eventId: string, event: ProjectEvent): Promise<void>;
}

export const IDEMPOTENCY_STORE = 'IDEMPOTENCY_STORE';
