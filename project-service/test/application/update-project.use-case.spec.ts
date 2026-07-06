import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateProjectUseCase } from '../../src/application/use-cases/update-project.use-case';
import { PROJECT_REPOSITORY } from '../../src/domain/ports/project.repository.port';
import { EVENT_PUBLISHER } from '../../src/domain/ports/event-publisher.port';
import { CACHE_PORT } from '../../src/domain/ports/cache.port';
import { Project, ProjectStatus } from '../../src/domain/entities/project.entity';
import { Role } from '../../src/application/auth/auth-context';

const makeProject = (overrides = {}): Project =>
  new Project({
    id: 'proj-1',
    name: 'Original',
    description: 'Desc',
    status: ProjectStatus.ACTIVE,
    ownerId: 'owner-1',
    version: 3,
    isDeleted: false,
    createdAt: new Date(),
    createdBy: 'user-1',
    updatedAt: new Date(),
    updatedBy: 'user-1',
    ...overrides,
  });

const mockRepo = { findById: jest.fn(), update: jest.fn() };
const mockPublisher = { publish: jest.fn() };
const mockCache = { del: jest.fn(), delByPattern: jest.fn() };

describe('UpdateProjectUseCase', () => {
  let useCase: UpdateProjectUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProjectUseCase,
        { provide: PROJECT_REPOSITORY, useValue: mockRepo },
        { provide: EVENT_PUBLISHER, useValue: mockPublisher },
        { provide: CACHE_PORT, useValue: mockCache },
      ],
    }).compile();

    useCase = module.get<UpdateProjectUseCase>(UpdateProjectUseCase);
  });

  it('updates project when version matches', async () => {
    const project = makeProject();
    const updatedProject = makeProject({ name: 'Updated', version: 4 });
    mockRepo.findById.mockResolvedValue(project);
    mockRepo.update.mockResolvedValue(updatedProject);
    mockPublisher.publish.mockResolvedValue(undefined);
    mockCache.del.mockResolvedValue(undefined);
    mockCache.delByPattern.mockResolvedValue(undefined);

    const result = await useCase.execute({
      projectId: 'proj-1',
      expectedVersion: 3,
      name: 'Updated',
      authContext: { userId: 'admin-1', role: Role.ADMIN },
    });

    expect(result.name).toBe('Updated');
    expect(mockRepo.update).toHaveBeenCalledWith(expect.any(Project), 3);
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictException when version mismatches', async () => {
    const project = makeProject(); // version = 3
    mockRepo.findById.mockResolvedValue(project);

    await expect(
      useCase.execute({
        projectId: 'proj-1',
        expectedVersion: 99, // wrong version
        name: 'Updated',
        authContext: { userId: 'admin-1', role: Role.ADMIN },
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when project does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'nonexistent',
        expectedVersion: 1,
        authContext: { userId: 'admin-1', role: Role.ADMIN },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException for VIEWER role', async () => {
    await expect(
      useCase.execute({
        projectId: 'proj-1',
        expectedVersion: 3,
        authContext: { userId: 'viewer-1', role: Role.VIEWER },
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
