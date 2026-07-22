-- V1__create_projects_table.sql
-- Initial schema for the project_creation_db

CREATE TABLE IF NOT EXISTS projects (
    id          UUID        PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
