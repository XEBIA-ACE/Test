// Use Case: ListProjects (paginated, filtered, read-through cache)

import { Inject, Injectable } from '@nestjs/common';
import {
  PROJECT_REPOSITORY,
  ProjectRepository,
  ProjectFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/project.repository.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/cache.port';
import { Project } from '../../domain/entities/project.entity';

export interface ListProjectsQuery {
  filter: ProjectFilter;
  pagination: PaginationOptions;
}

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(query: ListProjectsQuery): Promise<PaginatedResult<Project>> {
    const cacheKey = `projects:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get<PaginatedResult<Project>>(cacheKey);
    if (cached) return cached;

    const result = await this.projectRepository.findAll(
      query.filter,
      query.pagination,
    );

    await this.cache.set(cacheKey, result, 60);
    return result;
  }
}
