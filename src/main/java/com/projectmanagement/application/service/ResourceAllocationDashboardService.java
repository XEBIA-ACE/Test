package com.projectmanagement.application.service;

import com.projectmanagement.domain.model.ResourceAllocation;
import com.projectmanagement.domain.port.in.DashboardUseCase;
import com.projectmanagement.domain.port.out.ResourceAllocationRepository;
import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;
import com.projectmanagement.web.dto.ResourceAllocationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/**
 * Aggregates current resource allocation data for project managers.
 */
@Service
public class ResourceAllocationDashboardService implements DashboardUseCase {

    private final ResourceAllocationRepository resourceAllocationRepository;
    private final Clock clock;

    /**
     * Creates a dashboard service using the system UTC clock.
     *
     * @param resourceAllocationRepository allocation persistence port
     */
    public ResourceAllocationDashboardService(ResourceAllocationRepository resourceAllocationRepository) {
        this(resourceAllocationRepository, Clock.systemUTC());
    }

    ResourceAllocationDashboardService(
            ResourceAllocationRepository resourceAllocationRepository,
            Clock clock) {
        this.resourceAllocationRepository = resourceAllocationRepository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public ResourceAllocationDashboardResponse getResourceAllocationDashboard() {
        List<ResourceAllocation> allocations = resourceAllocationRepository.findAll();
        int allocatedHours = allocations.stream().mapToInt(ResourceAllocation::getAllocatedHours).sum();
        int capacityHours = allocations.stream().mapToInt(ResourceAllocation::getCapacityHours).sum();
        long overAllocatedResources = allocations.stream()
                .filter(allocation -> allocation.getAllocatedHours() > allocation.getCapacityHours())
                .map(ResourceAllocation::getResourceName)
                .distinct()
                .count();

        return new ResourceAllocationDashboardResponse(
                (int) allocations.stream()
                        .map(ResourceAllocation::getResourceName)
                        .distinct()
                        .count(),
                allocatedHours,
                capacityHours,
                calculateUtilization(allocatedHours, capacityHours),
                overAllocatedResources,
                Instant.now(clock),
                allocations.stream().map(ResourceAllocationResponse::from).toList());
    }

    private double calculateUtilization(int allocatedHours, int capacityHours) {
        if (capacityHours == 0) {
            return 0;
        }
        return Math.round((allocatedHours * 1000.0) / capacityHours) / 10.0;
    }
}
