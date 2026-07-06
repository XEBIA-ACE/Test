// TypeORM adapter implementing ProjectRepository port

import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectRepository,
  ProjectFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/ports/project.repository.port';
import { Project, ProjectStatus } from '../../../domain/entities/project.entity';
import { ProjectOrmEntity } from './project.orm-entity';

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly repo: Repository<ProjectOrmEntity>,
  ) {}

  async findById(id: string): Promise<Project | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(
    filter: ProjectFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Project>> {
    const qb = this.repo.createQueryBuilder('p').where('p.is_deleted = false');

    if (filter.status) qb.andWhere('p.status = :status', { status: filter.status });
    if (filter.ownerId) qb.andWhere('p.owner_id = :ownerId', { ownerId: filter.ownerId });
    if (filter.name) qb.andWhere('p.name ILIKE :name', { name: `%${filter.name}%` });
    if (filter.createdFrom)
      qb.andWhere('p.created_at >= :createdFrom', { createdFrom: filter.createdFrom });
    if (filter.createdTo)
      qb.andWhere('p.created_at <= :createdTo', { createdTo: filter.createdTo });

    const total = await qb.getCount();
    const orms = await qb
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return {
      data: orms.map((o) => this.toDomain(o)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async save(project: Project): Promise<Project> {
    const orm = this.toOrm(project);
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(project: Project, expectedVersion: number): Promise<Project> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProjectOrmEntity)
      .set({
        name: project.name,
        description: project.description,
        status: project.status,
        ownerId: project.ownerId,
        updatedBy: project.updatedBy,
        version: () => 'version + 1',
      })
      .where('id = :id AND version = :version', {
        id: project.id,
        version: expectedVersion,
      })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        `Optimistic lock conflict on project ${project.id}`,
      );
    }

    const updated = await this.repo.findOne({ where: { id: project.id } });
    if (!updated) throw new InternalServerErrorException('Project not found after update');
    return this.toDomain(updated);
  }

  async softDelete(project: Project): Promise<void> {
    await this.repo.update(project.id, {
      isDeleted: true,
      deletedAt: project.deletedAt ?? new Date(),
      deletedBy: project.deletedBy ?? undefined,
    });
  }

  // ── Mappers ──────────────────────────────────────────────────────────────

  private toDomain(orm: ProjectOrmEntity): Project {
    return new Project({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      status: orm.status,
      ownerId: orm.ownerId,
      version: orm.version,
      isDeleted: orm.isDeleted,
      deletedAt: orm.deletedAt ?? undefined,
      deletedBy: orm.deletedBy ?? undefined,
      createdAt: orm.createdAt,
      createdBy: orm.createdBy,
      updatedAt: orm.updatedAt,
      updatedBy: orm.updatedBy,
    });
  }

  private toOrm(project: Project): ProjectOrmEntity {
    const orm = new ProjectOrmEntity();
    orm.id = project.id;
    orm.name = project.name;
    orm.description = project.description;
    orm.status = project.status;
    orm.ownerId = project.ownerId;
    orm.version = project.version;
    orm.isDeleted = project.isDeleted;
    orm.deletedAt = project.deletedAt ?? null;
    orm.deletedBy = project.deletedBy ?? null;
    orm.createdAt = project.createdAt;
    orm.createdBy = project.createdBy;
    orm.updatedAt = project.updatedAt;
    orm.updatedBy = project.updatedBy;
    return orm;
  }
}
