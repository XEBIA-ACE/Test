package com.projectmanagement.web.dto;

import java.time.Instant;
import java.util.List;

/**
 * Current resource allocation dashboard snapshot.
 */
public record ResourceAllocationDashboardResponse(
        int totalResources,
        int allocatedHours,
        int capacityHours,
        double utilizationPercentage,
        long overAllocatedResources,
        Instant lastUpdated,
        List<ResourceAllocationResponse> allocations) {
}
