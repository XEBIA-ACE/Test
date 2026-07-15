package com.projectmanagement.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Resource capacity assigned to a project.
 */
public class ResourceAllocation {

    private UUID id;
    private String resourceName;
    private String role;
    private UUID projectId;
    private String projectName;
    private int allocatedHours;
    private int capacityHours;
    private Instant updatedAt;

    public ResourceAllocation() {}

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

    public UUID getId() { return id; }
    public String getResourceName() { return resourceName; }
    public String getRole() { return role; }
    public UUID getProjectId() { return projectId; }
    public String getProjectName() { return projectName; }
    public int getAllocatedHours() { return allocatedHours; }
    public int getCapacityHours() { return capacityHours; }
    public Instant getUpdatedAt() { return updatedAt; }

    public double utilizationPercentage() {
        if (capacityHours == 0) {
            return 0;
        }
        return Math.round((allocatedHours * 1000.0) / capacityHours) / 10.0;
    }
}
