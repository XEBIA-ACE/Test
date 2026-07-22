package com.example.projectcreation.adapter.web.dto;

import com.example.projectcreation.domain.model.Project;
import com.example.projectcreation.domain.model.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Outbound DTO returned to API consumers.
 */
public record ProjectResponse(
        UUID id,
        String name,
        String description,
        ProjectStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    /** Convenience factory from domain model. */
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
