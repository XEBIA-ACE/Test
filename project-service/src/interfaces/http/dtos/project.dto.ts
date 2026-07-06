// DTOs for Project API

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../domain/entities/project.entity';
import { Type } from 'class-transformer';

// ── Request DTOs ─────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Project description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ProjectStatus, description: 'Project status' })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiProperty({ description: 'Owner user ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  ownerId: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Owner user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ description: 'Expected version for optimistic locking' })
  @IsInt()
  @Min(1)
  version: number;
}

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: ProjectStatus }) status: ProjectStatus;
  @ApiProperty() ownerId: string;
  @ApiProperty() version: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() createdBy: string;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() updatedBy: string;
}

export class PaginatedProjectsResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] }) data: ProjectResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
