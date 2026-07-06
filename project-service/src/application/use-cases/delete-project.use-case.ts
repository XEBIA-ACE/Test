// Use Case: DeleteProject (soft-delete)

import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PROJECT_REPOSITORY,
  ProjectRepository,
} from '../../domain/ports/project.repository.port';
import {
  EVENT_PUBLISHER,
  EventPublisher,
} from '../../domain/ports/event-publisher.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/cache.port';
import { ProjectDeletedEvent } from '../../domain/events/project.events';
import { AuthContext, Role } from '../auth/auth-context';

export interface DeleteProjectCommand {
  projectId: string;
  authContext: AuthContext;
}

@Injectable()
export class DeleteProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    if (command.authContext.role !== Role.ADMIN) {
      throw new ForbiddenException('Only Admins can delete projects');
    }

    const project = await this.projectRepository.findById(command.projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project ${command.projectId} not found`);
    }

    project.softDelete(command.authContext.userId);
    await this.projectRepository.softDelete(project);

    // Invalidate caches
    await this.cache.del(`projects:detail:${command.projectId}`);
    await this.cache.delByPattern('projects:list:*');

    await this.eventPublisher.publish(
      new ProjectDeletedEvent(project.id, command.authContext.userId),
    );
  }
}
