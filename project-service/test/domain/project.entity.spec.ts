import { Project, ProjectStatus } from '../../src/domain/entities/project.entity';

const baseProps = {
  id: 'test-id',
  name: 'Test Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  ownerId: 'owner-id',
  version: 1,
  isDeleted: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'user-1',
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  updatedBy: 'user-1',
};

describe('Project domain entity', () => {
  it('constructs with correct properties', () => {
    const project = new Project(baseProps);
    expect(project.id).toBe('test-id');
    expect(project.name).toBe('Test Project');
    expect(project.status).toBe(ProjectStatus.ACTIVE);
    expect(project.isDeleted).toBe(false);
    expect(project.version).toBe(1);
  });

  describe('update()', () => {
    it('updates mutable fields and increments version', () => {
      const project = new Project(baseProps);
      project.update({ name: 'Updated Name', status: ProjectStatus.ARCHIVED }, 'user-2');

      expect(project.name).toBe('Updated Name');
      expect(project.status).toBe(ProjectStatus.ARCHIVED);
      expect(project.version).toBe(2);
      expect(project.updatedBy).toBe('user-2');
    });

    it('does not change fields that are not provided', () => {
      const project = new Project(baseProps);
      project.update({ name: 'New Name' }, 'user-2');

      expect(project.description).toBe('A test project');
      expect(project.ownerId).toBe('owner-id');
    });
  });

  describe('softDelete()', () => {
    it('marks project as deleted and increments version', () => {
      const project = new Project(baseProps);
      project.softDelete('admin-user');

      expect(project.isDeleted).toBe(true);
      expect(project.deletedBy).toBe('admin-user');
      expect(project.deletedAt).toBeInstanceOf(Date);
      expect(project.version).toBe(2);
    });
  });
});
