package com.projectmanagement.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Core domain entity representing a Project.
 * This is a pure domain object — no framework annotations.
 */
public class Project {

    private UUID id;
    private String name;
    private String description;
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String ownerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Project() {}

    public Project(
            UUID id,
            String name,
            String description,
            ProjectStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String ownerId,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ── Factory ──────────────────────────────────────────────────────────────

    /**
     * Reconstitutes a Project from persisted state (used by the persistence adapter).
     */
    public static Project reconstitute(
            UUID id,
            String name,
            String description,
            ProjectStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String ownerId,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        return new Project(id, name, description, status, startDate, endDate, ownerId, createdAt, updatedAt);
    }

    public static Project create(
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            String ownerId) {
        LocalDateTime now = LocalDateTime.now();
        return new Project(
                UUID.randomUUID(),
                name,
                description,
                ProjectStatus.PLANNING,
                startDate,
                endDate,
                ownerId,
                now,
                now);
    }

    // ── Domain behaviour ─────────────────────────────────────────────────────

    public void activate() {
        if (this.status != ProjectStatus.PLANNING) {
            throw new IllegalStateException(
                    "Only projects in PLANNING status can be activated. Current status: " + this.status);
        }
        this.status = ProjectStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void complete() {
        if (this.status != ProjectStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Only ACTIVE projects can be completed. Current status: " + this.status);
        }
        this.status = ProjectStatus.COMPLETED;
        this.updatedAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = ProjectStatus.ARCHIVED;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateDetails(String name, String description, LocalDate startDate, LocalDate endDate) {
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
