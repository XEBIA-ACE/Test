// Projects Feature Module

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectOrmEntity } from '../../infrastructure/persistence/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from '../../infrastructure/persistence/typeorm/typeorm-project.repository';
import { RedisCacheAdapter } from '../../infrastructure/cache/redis-cache.adapter';
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq-event-publisher.adapter';
import { PROJECT_REPOSITORY } from '../../domain/ports/project.repository.port';
import { EVENT_PUBLISHER } from '../../domain/ports/event-publisher.port';
import { CACHE_PORT } from '../../domain/ports/cache.port';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { ProjectsController } from '../../interfaces/http/controllers/projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectOrmEntity])],
  controllers: [ProjectsController],
  providers: [
    // Adapters
    { provide: PROJECT_REPOSITORY, useClass: TypeOrmProjectRepository },
    { provide: CACHE_PORT, useClass: RedisCacheAdapter },
    { provide: EVENT_PUBLISHER, useClass: RabbitMQEventPublisher },
    // Use Cases
    CreateProjectUseCase,
    GetProjectUseCase,
    ListProjectsUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
  ],
})
export class ProjectsModule {}
