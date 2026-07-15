package com.projectmanagement.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA representation of current resource capacity assignments.
 */
@Entity
@Table(name = "resource_allocations")
public class ResourceAllocationJpaEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "resource_name", nullable = false, length = 255)
    private String resourceName;

    @Column(name = "role", nullable = false, length = 100)
    private String role;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "project_name", nullable = false, length = 255)
    private String projectName;

    @Column(name = "allocated_hours", nullable = false)
    private int allocatedHours;

    @Column(name = "capacity_hours", nullable = false)
    private int capacityHours;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ResourceAllocationJpaEntity() {}

    public UUID getId() { return id; }
    public String getResourceName() { return resourceName; }
    public String getRole() { return role; }
    public UUID getProjectId() { return projectId; }
    public String getProjectName() { return projectName; }
    public int getAllocatedHours() { return allocatedHours; }
    public int getCapacityHours() { return capacityHours; }
    public Instant getUpdatedAt() { return updatedAt; }
}
