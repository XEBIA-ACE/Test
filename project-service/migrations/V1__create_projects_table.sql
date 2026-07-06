-- Migration: Create projects table

CREATE TYPE project_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'COMPLETED');

CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    description TEXT           NOT NULL,
    status      project_status NOT NULL DEFAULT 'ACTIVE',
    owner_id    UUID           NOT NULL,
    version     INTEGER        NOT NULL DEFAULT 1,
    is_deleted  BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at  TIMESTAMPTZ,
    deleted_by  VARCHAR(255),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(255)   NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_by  VARCHAR(255)   NOT NULL
);

CREATE INDEX idx_projects_owner_id   ON projects (owner_id);
CREATE INDEX idx_projects_status     ON projects (status);
CREATE INDEX idx_projects_is_deleted ON projects (is_deleted);
CREATE INDEX idx_projects_created_at ON projects (created_at DESC);
