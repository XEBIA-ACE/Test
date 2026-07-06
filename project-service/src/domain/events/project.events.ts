// Domain Events emitted after successful transaction commits.

export abstract class DomainEvent {
  readonly occurredAt: Date;
  constructor() {
    this.occurredAt = new Date();
  }
}

export class ProjectCreatedEvent extends DomainEvent {
  readonly eventType = 'ProjectCreated';
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly createdBy: string,
  ) {
    super();
  }
}

export class ProjectUpdatedEvent extends DomainEvent {
  readonly eventType = 'ProjectUpdated';
  constructor(
    public readonly projectId: string,
    public readonly updatedBy: string,
    public readonly changes: Record<string, unknown>,
  ) {
    super();
  }
}

export class ProjectDeletedEvent extends DomainEvent {
  readonly eventType = 'ProjectDeleted';
  constructor(
    public readonly projectId: string,
    public readonly deletedBy: string,
  ) {
    super();
  }
}
