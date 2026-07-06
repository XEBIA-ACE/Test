import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CreateProjectUseCase } from '../../src/application/use-cases/create-project.use-case';
import { PROJECT_REPOSITORY } from '../../src/domain/ports/project.repository.port';
import { EVENT_PUBLISHER } from '../../src/domain/ports/event-publisher.port';
import { CACHE_PORT } from '../../src/domain/ports/cache.port';
import { ProjectStatus } from '../../src/domain/entities/project.entity';
import { Role } from '../../src/application/auth/auth-context';

const mockRepo = {
  save: jest.fn(),
};
const mockPublisher = {
  publish: jest.fn(),
};
const mockCache = {
  delByPattern: jest.fn(),
};

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectUseCase,
        { provide: PROJECT_REPOSITORY, useValue: mockRepo },
        { provide: EVENT_PUBLISHER, useValue: mockPublisher },
        { provide: CACHE_PORT, useValue: mockCache },
      ],
    }).compile();

    useCase = module.get<CreateProjectUseCase>(CreateProjectUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('creates a project for ADMIN role', async () => {
    const savedProject = {
      id: 'new-id',
      name: 'My Project',
      description: 'Desc',
      status: ProjectStatus.ACTIVE,
      ownerId: 'owner-1',
      version: 1,
      isDeleted: false,
      createdAt: new Date(),
      createdBy: 'admin-1',
      updatedAt: new Date(),
      updatedBy: 'admin-1',
    };
    mockRepo.save.mockResolvedValue(savedProject);
    mockPublisher.publish.mockResolvedValue(undefined);
    mockCache.delByPattern.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'My Project',
      description: 'Desc',
      status: ProjectStatus.ACTIVE,
      ownerId: 'owner-1',
      authContext: { userId: 'admin-1', role: Role.ADMIN },
    });

    expect(result).toEqual(savedProject);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockCache.delByPattern).toHaveBeenCalledWith('projects:list:*');
  });

  it('creates a project for PROJECT_MANAGER role', async () => {
    const savedProject = {
      id: 'new-id-2',
      name: 'PM Project',
      description: 'Desc',
      status: ProjectStatus.ACTIVE,
      ownerId: 'owner-2',
      version: 1,
      isDeleted: false,
      createdAt: new Date(),
      createdBy: 'pm-1',
      updatedAt: new Date(),
      updatedBy: 'pm-1',
    };
    mockRepo.save.mockResolvedValue(savedProject);
    mockPublisher.publish.mockResolvedValue(undefined);
    mockCache.delByPattern.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'PM Project',
      description: 'Desc',
      status: ProjectStatus.ACTIVE,
      ownerId: 'owner-2',
      authContext: { userId: 'pm-1', role: Role.PROJECT_MANAGER },
    });

    expect(result).toEqual(savedProject);
  });

  it('throws ForbiddenException for VIEWER role', async () => {
    await expect(
      useCase.execute({
        name: 'Viewer Project',
        description: 'Desc',
        status: ProjectStatus.ACTIVE,
        ownerId: 'owner-3',
        authContext: { userId: 'viewer-1', role: Role.VIEWER },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
