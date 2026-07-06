// Projects REST Controller

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthContext } from '../../../application/auth/auth-context';
import { CreateProjectUseCase } from '../../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../../application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../../application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../../../application/use-cases/delete-project.use-case';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ListProjectsQueryDto,
  ProjectResponseDto,
  PaginatedProjectsResponseDto,
} from '../dtos/project.dto';
import { Project } from '../../../domain/entities/project.entity';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly getProject: GetProjectUseCase,
    private readonly listProjects: ListProjectsUseCase,
    private readonly updateProject: UpdateProjectUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() auth: AuthContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.createProject.execute({ ...dto, authContext: auth });
    return this.toResponse(project);
  }

  @Get()
  @ApiOperation({ summary: 'List projects (paginated, filtered)' })
  @ApiResponse({ status: 200, type: PaginatedProjectsResponseDto })
  async list(
    @Query() query: ListProjectsQueryDto,
    @CurrentUser() _auth: AuthContext,
  ): Promise<PaginatedProjectsResponseDto> {
    const result = await this.listProjects.execute({
      filter: {
        status: query.status,
        ownerId: query.ownerId,
        name: query.name,
        createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
        createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
      },
      pagination: { page: query.page ?? 1, limit: query.limit ?? 20 },
    });
    return {
      data: result.data.map((p) => this.toResponse(p)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _auth: AuthContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.getProject.execute({ projectId: id });
    return this.toResponse(project);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project (optimistic locking)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 409, description: 'Optimistic lock conflict' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() auth: AuthContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.updateProject.execute({
      projectId: id,
      expectedVersion: dto.version,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      ownerId: dto.ownerId,
      authContext: auth,
    });
    return this.toResponse(project);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a project' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() auth: AuthContext,
  ): Promise<void> {
    await this.deleteProject.execute({ projectId: id, authContext: auth });
  }

  // ── Mapper ────────────────────────────────────────────────────────────────

  private toResponse(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      ownerId: project.ownerId,
      version: project.version,
      createdAt: project.createdAt,
      createdBy: project.createdBy,
      updatedAt: project.updatedAt,
      updatedBy: project.updatedBy,
    };
  }
}
