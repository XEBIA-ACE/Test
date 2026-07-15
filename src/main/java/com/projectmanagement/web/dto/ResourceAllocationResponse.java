package com.projectmanagement.web.dto;

import com.projectmanagement.domain.model.ResourceAllocation;

import java.time.Instant;
import java.util.UUID;

/**
 * Resource allocation row displayed by dashboard clients.
 */
public record ResourceAllocationResponse(
        UUID id,
        String resourceName,
        String role,
        UUID projectId,
        String projectName,
        int allocatedHours,
        int capacityHours,
        double utilizationPercentage,
        String utilizationStatus,
        Instant updatedAt) {

    public static ResourceAllocationResponse from(ResourceAllocation allocation) {
        double utilization = allocation.utilizationPercentage();
        return new ResourceAllocationResponse(
                allocation.getId(),
                allocation.getResourceName(),
                allocation.getRole(),
                allocation.getProjectId(),
                allocation.getProjectName(),
                allocation.getAllocatedHours(),
                allocation.getCapacityHours(),
                utilization,
                statusFor(utilization),
                allocation.getUpdatedAt());
    }

    private static String statusFor(double utilization) {
        if (utilization > 100) {
            return "OVER_ALLOCATED";
        }
        if (utilization >= 75) {
            return "ALLOCATED";
        }
        return "AVAILABLE";
    }
}
