/**
 * Thrown when a delivery failure is transient and the operation should be retried.
 */
export class TransientDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TransientDeliveryError';
  }
}

/**
 * Thrown when a delivery failure is permanent and the notification should be
 * routed to the dead-letter queue without further retries.
 */
export class PermanentDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PermanentDeliveryError';
  }
}

/**
 * Thrown when an event has already been processed (idempotency guard).
 */
export class DuplicateEventError extends Error {
  constructor(eventId: string) {
    super(`Event ${eventId} has already been processed`);
    this.name = 'DuplicateEventError';
  }
}
