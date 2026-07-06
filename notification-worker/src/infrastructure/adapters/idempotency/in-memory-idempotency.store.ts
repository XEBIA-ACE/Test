import { Injectable } from '@nestjs/common';
import { IIdempotencyStore } from '../../domain/ports/idempotency-store.port';
import { ProjectEvent } from '../../domain/entities/project-event.entity';

/**
 * Adapter: in-memory idempotency store.
 *
 * TODO: replace with a Redis-backed implementation for multi-replica deployments.
 */
@Injectable()
export class InMemoryIdempotencyStore implements IIdempotencyStore {
  private readonly processed = new Map<string, { event: ProjectEvent; processedAt: Date }>();

  async hasBeenProcessed(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markAsProcessed(eventId: string, event: ProjectEvent): Promise<void> {
    this.processed.set(eventId, { event, processedAt: new Date() });
  }
}
