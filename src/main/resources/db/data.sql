-- Seed users
INSERT INTO users (id, display_name) VALUES ('user-001', 'Alice Owner');
INSERT INTO users (id, display_name) VALUES ('user-002', 'Bob Editor');
INSERT INTO users (id, display_name) VALUES ('user-003', 'Charlie Viewer');

-- Seed a project
INSERT INTO projects (id, name, description, type, owner_id, created_at, updated_at)
VALUES ('proj-001', 'Alpha Project', 'Initial project description', 'INTERNAL', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed permissions
INSERT INTO project_permissions (id, user_id, project_id, permission_level)
VALUES ('perm-001', 'user-001', 'proj-001', 'OWNER');
INSERT INTO project_permissions (id, user_id, project_id, permission_level)
VALUES ('perm-002', 'user-002', 'proj-001', 'EDITOR');
INSERT INTO project_permissions (id, user_id, project_id, permission_level)
VALUES ('perm-003', 'user-003', 'proj-001', 'VIEWER');
