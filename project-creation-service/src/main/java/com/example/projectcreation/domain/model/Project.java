package com.example.projectcreation.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Core domain entity representing a Project.
 * Pure POJO — no framework dependencies.
 */
public class Project {

    private final UUID id;
    private String name;
    private String description;
    private ProjectStatus status;
    private final Instant createdAt;
    private Instant updatedAt;

    public Project(UUID id, String name, String description, ProjectStatus status,
                   Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** Factory method for creating a brand-new project. */
    public static Project create(String name, String description) {
        Instant now = Instant.now();
        return new Project(UUID.randomUUID(), name, description, ProjectStatus.PENDING, now, now);
    }

    // ── Behaviour ────────────────────────────────────────────────────────────

    public void activate() {
        this.status = ProjectStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = ProjectStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ProjectStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
}
