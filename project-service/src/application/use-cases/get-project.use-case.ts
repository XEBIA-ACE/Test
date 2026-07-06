// Use Case: GetProject (read-through cache)

import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project } from '../../domain/entities/project.entity';
import {
  PROJECT_REPOSITORY,
  ProjectRepository,
} from '../../domain/ports/project.repository.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/cache.port';

export interface GetProjectQuery {
  projectId: string;
}

@Injectable()
export class GetProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(query: GetProjectQuery): Promise<Project> {
    const cacheKey = `projects:detail:${query.projectId}`;
    const cached = await this.cache.get<Project>(cacheKey);
    if (cached) return cached;

    const project = await this.projectRepository.findById(query.projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project ${query.projectId} not found`);
    }

    await this.cache.set(cacheKey, project, 300);
    return project;
  }
}
