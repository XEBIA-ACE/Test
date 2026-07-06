// Use Case: UpdateProject (with optimistic locking)

import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectStatus } from '../../domain/entities/project.entity';
import {
  PROJECT_REPOSITORY,
  ProjectRepository,
} from '../../domain/ports/project.repository.port';
import {
  EVENT_PUBLISHER,
  EventPublisher,
} from '../../domain/ports/event-publisher.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/cache.port';
import { ProjectUpdatedEvent } from '../../domain/events/project.events';
import { AuthContext, Role } from '../auth/auth-context';
import { Project } from '../../domain/entities/project.entity';

export interface UpdateProjectCommand {
  projectId: string;
  expectedVersion: number;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
  authContext: AuthContext;
}

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(command: UpdateProjectCommand): Promise<Project> {
    if (
      command.authContext.role !== Role.ADMIN &&
      command.authContext.role !== Role.PROJECT_MANAGER
    ) {
      throw new ForbiddenException('Insufficient permissions to update a project');
    }

    const project = await this.projectRepository.findById(command.projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project ${command.projectId} not found`);
    }

    if (project.version !== command.expectedVersion) {
      throw new ConflictException(
        `Optimistic lock conflict: expected version ${command.expectedVersion}, current version ${project.version}`,
      );
    }

    const changes: Record<string, unknown> = {};
    if (command.name !== undefined) changes.name = command.name;
    if (command.description !== undefined) changes.description = command.description;
    if (command.status !== undefined) changes.status = command.status;
    if (command.ownerId !== undefined) changes.ownerId = command.ownerId;

    project.update(changes as any, command.authContext.userId);

    const updated = await this.projectRepository.update(project, command.expectedVersion);

    // Invalidate caches
    await this.cache.del(`projects:detail:${command.projectId}`);
    await this.cache.delByPattern('projects:list:*');

    await this.eventPublisher.publish(
      new ProjectUpdatedEvent(updated.id, updated.updatedBy, changes),
    );

    return updated;
  }
}
