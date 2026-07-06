// Port: ProjectRepository
// Defines the contract that any persistence adapter must satisfy.

import { Project } from '../entities/project.entity';
import { ProjectStatus } from '../entities/project.entity';

export interface ProjectFilter {
  status?: ProjectStatus;
  ownerId?: string;
  name?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(
    filter: ProjectFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Project>>;
  save(project: Project): Promise<Project>;
  update(project: Project, expectedVersion: number): Promise<Project>;
  softDelete(project: Project): Promise<void>;
}
