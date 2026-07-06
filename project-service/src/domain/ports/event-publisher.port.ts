// Port: EventPublisher
// Defines the contract for publishing domain events to a message broker.

import { DomainEvent } from '../events/project.events';

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
