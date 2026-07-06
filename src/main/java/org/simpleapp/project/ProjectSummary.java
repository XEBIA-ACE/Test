package org.simpleapp.project;

import java.time.Instant;
import java.util.UUID;

/**
 * Listing entry for a project (US-003 FR-002).
 *
 * <p>Carries at minimum the project name and owner; {@code id}, {@code type}
 * and {@code createdAt} are included to support navigation and deterministic
 * ordering on the client.
 */
public class ProjectSummary {

    private final UUID id;
    private final String name;
    private final UUID ownerId;
    private final String type;
    private final Instant createdAt;

    public ProjectSummary(Project project) {
        this.id = project.getId();
        this.name = project.getName();
        this.ownerId = project.getOwnerId();
        this.type = project.getType();
        this.createdAt = project.getCreatedAt();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getType() {
        return type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
