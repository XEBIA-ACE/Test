package org.simpleapp.project;

import java.time.Instant;
import java.util.UUID;

/**
 * Core Project record (US-003, SVC-PROJ-01).
 *
 * <p>Holds the configuration attributes exposed by the detail view: name,
 * description, type and ownership, along with lifecycle timestamps.
 */
public class Project {

    private final UUID id;
    private String name;
    private String description;
    private String type;
    private UUID ownerId;
    private final Instant createdAt;
    private Instant updatedAt;

    public Project(UUID id, String name, String description, String type, UUID ownerId,
                   Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getType() {
        return type;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
