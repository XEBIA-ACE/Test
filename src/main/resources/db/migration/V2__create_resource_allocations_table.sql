CREATE TABLE resource_allocations (
    id               UUID         PRIMARY KEY,
    resource_name    VARCHAR(255) NOT NULL,
    role             VARCHAR(100) NOT NULL,
    project_id       UUID         NOT NULL,
    project_name     VARCHAR(255) NOT NULL,
    allocated_hours  INTEGER      NOT NULL CHECK (allocated_hours >= 0),
    capacity_hours   INTEGER      NOT NULL CHECK (capacity_hours > 0),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resource_allocations_project
    ON resource_allocations (project_id);

CREATE INDEX idx_resource_allocations_updated_at
    ON resource_allocations (updated_at DESC);
