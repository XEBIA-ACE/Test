import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteProjectUseCase } from '../../src/application/use-cases/delete-project.use-case';
import { PROJECT_REPOSITORY } from '../../src/domain/ports/project.repository.port';
import { EVENT_PUBLISHER } from '../../src/domain/ports/event-publisher.port';
import { CACHE_PORT } from '../../src/domain/ports/cache.port';
import { Project, ProjectStatus } from '../../src/domain/entities/project.entity';
import { Role } from '../../src/application/auth/auth-context';

const makeProject = (): Project =>
  new Project({
    id: 'proj-del',
    name: 'To Delete',
    description: 'Desc',
    status: ProjectStatus.ACTIVE,
    ownerId: 'owner-1',
    version: 1,
    isDeleted: false,
    createdAt: new Date(),
    createdBy: 'user-1',
    updatedAt: new Date(),
    updatedBy: 'user-1',
  });

const mockRepo = { findById: jest.fn(), softDelete: jest.fn() };
const mockPublisher = { publish: jest.fn() };
const mockCache = { del: jest.fn(), delByPattern: jest.fn() };

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProjectUseCase,
        { provide: PROJECT_REPOSITORY, useValue: mockRepo },
        { provide: EVENT_PUBLISHER, useValue: mockPublisher },
        { provide: CACHE_PORT, useValue: mockCache },
      ],
    }).compile();

    useCase = module.get<DeleteProjectUseCase>(DeleteProjectUseCase);
  });

  it('soft-deletes a project for ADMIN role', async () => {
    const project = makeProject();
    mockRepo.findById.mockResolvedValue(project);
    mockRepo.softDelete.mockResolvedValue(undefined);
    mockPublisher.publish.mockResolvedValue(undefined);
    mockCache.del.mockResolvedValue(undefined);
    mockCache.delByPattern.mockResolvedValue(undefined);

    await useCase.execute({
      projectId: 'proj-del',
      authContext: { userId: 'admin-1', role: Role.ADMIN },
    });

    expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockCache.del).toHaveBeenCalledWith('projects:detail:proj-del');
    expect(mockCache.delByPattern).toHaveBeenCalledWith('projects:list:*');
  });

  it('throws ForbiddenException for non-ADMIN roles', async () => {
    await expect(
      useCase.execute({
        projectId: 'proj-del',
        authContext: { userId: 'pm-1', role: Role.PROJECT_MANAGER },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepo.softDelete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when project does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'nonexistent',
        authContext: { userId: 'admin-1', role: Role.ADMIN },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
