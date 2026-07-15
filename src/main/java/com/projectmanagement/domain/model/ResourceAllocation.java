package com.projectmanagement.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Resource capacity assigned to a project.
 */
public class ResourceAllocation {

    private final UUID id;
    private final String resourceName;
    private final String role;
    private final UUID projectId;
    private final String projectName;
    private final int allocatedHours;
    private final int capacityHours;
    private final Instant updatedAt;

    /**
     * Creates a project allocation for a resource.
     *
     * @param id allocation identifier
     * @param resourceName display name of the resource
     * @param role role assigned to the resource
     * @param projectId project identifier
     * @param projectName display name of the project
     * @param allocatedHours assigned hours
     * @param capacityHours available hours
     * @param updatedAt most recent source update
     */
    public ResourceAllocation(
            UUID id,
            String resourceName,
            String role,
            UUID projectId,
            String projectName,
            int allocatedHours,
            int capacityHours,
            Instant updatedAt) {
        this.id = id;
        this.resourceName = resourceName;
        this.role = role;
        this.projectId = projectId;
        this.projectName = projectName;
        this.allocatedHours = allocatedHours;
        this.capacityHours = capacityHours;
        this.updatedAt = updatedAt;
    }

    /** @return allocation identifier */
    public UUID getId() { return id; }
    /** @return resource display name */
    public String getResourceName() { return resourceName; }
    /** @return assigned role */
    public String getRole() { return role; }
    /** @return project identifier */
    public UUID getProjectId() { return projectId; }
    /** @return project display name */
    public String getProjectName() { return projectName; }
    /** @return assigned hours */
    public int getAllocatedHours() { return allocatedHours; }
    /** @return available hours */
    public int getCapacityHours() { return capacityHours; }
    /** @return most recent source update */
    public Instant getUpdatedAt() { return updatedAt; }

    /**
     * Calculates assigned hours as a percentage of capacity.
     *
     * @return utilization rounded to one decimal place
     */
    public double utilizationPercentage() {
        if (capacityHours == 0) {
            return 0;
        }
        return Math.round((allocatedHours * 1000.0) / capacityHours) / 10.0;
    }
}
