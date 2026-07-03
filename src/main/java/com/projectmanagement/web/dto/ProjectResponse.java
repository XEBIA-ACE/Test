package com.projectmanagement.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.projectmanagement.domain.model.Project;
import com.projectmanagement.domain.model.ProjectStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO representing a Project resource.
 */
public class ProjectResponse {

    private UUID id;
    private String name;
    private String description;
    private ProjectStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String ownerId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public ProjectResponse() {}

    public static ProjectResponse from(Project project) {
        ProjectResponse dto = new ProjectResponse();
        dto.id = project.getId();
        dto.name = project.getName();
        dto.description = project.getDescription();
        dto.status = project.getStatus();
        dto.startDate = project.getStartDate();
        dto.endDate = project.getEndDate();
        dto.ownerId = project.getOwnerId();
        dto.createdAt = project.getCreatedAt();
        dto.updatedAt = project.getUpdatedAt();
        return dto;
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ProjectStatus getStatus() { return status; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getOwnerId() { return ownerId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
