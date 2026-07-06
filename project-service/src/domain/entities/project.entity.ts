// Domain Entity: Project
// Represents the core business object for a project.

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
}

export interface ProjectProps {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export class Project {
  readonly id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  readonly createdAt: Date;
  readonly createdBy: string;
  updatedAt: Date;
  updatedBy: string;

  constructor(props: ProjectProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.status = props.status;
    this.ownerId = props.ownerId;
    this.version = props.version;
    this.isDeleted = props.isDeleted;
    this.deletedAt = props.deletedAt ?? null;
    this.deletedBy = props.deletedBy ?? null;
    this.createdAt = props.createdAt;
    this.createdBy = props.createdBy;
    this.updatedAt = props.updatedAt;
    this.updatedBy = props.updatedBy;
  }

  /**
   * Apply an update to the project. Increments version for optimistic locking.
   */
  update(
    fields: Partial<Pick<ProjectProps, 'name' | 'description' | 'status' | 'ownerId'>>,
    updatedBy: string,
  ): void {
    if (fields.name !== undefined) this.name = fields.name;
    if (fields.description !== undefined) this.description = fields.description;
    if (fields.status !== undefined) this.status = fields.status;
    if (fields.ownerId !== undefined) this.ownerId = fields.ownerId;
    this.updatedAt = new Date();
    this.updatedBy = updatedBy;
    this.version += 1;
  }

  /**
   * Soft-delete the project.
   */
  softDelete(deletedBy: string): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.updatedAt = new Date();
    this.updatedBy = deletedBy;
    this.version += 1;
  }
}
