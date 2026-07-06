// Use Case: CreateProject

import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import {
  PROJECT_REPOSITORY,
  ProjectRepository,
} from '../../domain/ports/project.repository.port';
import {
  EVENT_PUBLISHER,
  EventPublisher,
} from '../../domain/ports/event-publisher.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/cache.port';
import { ProjectCreatedEvent } from '../../domain/events/project.events';
import { AuthContext, Role } from '../auth/auth-context';

export interface CreateProjectCommand {
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  authContext: AuthContext;
}

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    if (
      command.authContext.role !== Role.ADMIN &&
      command.authContext.role !== Role.PROJECT_MANAGER
    ) {
      throw new ForbiddenException('Insufficient permissions to create a project');
    }

    const now = new Date();
    const project = new Project({
      id: uuidv4(),
      name: command.name,
      description: command.description,
      status: command.status,
      ownerId: command.ownerId,
      version: 1,
      isDeleted: false,
      createdAt: now,
      createdBy: command.authContext.userId,
      updatedAt: now,
      updatedBy: command.authContext.userId,
    });

    const saved = await this.projectRepository.save(project);

    // Invalidate list cache
    await this.cache.delByPattern('projects:list:*');

    // Publish domain event
    await this.eventPublisher.publish(
      new ProjectCreatedEvent(saved.id, saved.name, saved.ownerId, saved.createdBy),
    );

    return saved;
  }
}
