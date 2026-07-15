package com.projectmanagement.application.service;

import com.projectmanagement.domain.model.ResourceAllocation;
import com.projectmanagement.domain.port.out.ResourceAllocationRepository;
import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ResourceAllocationDashboardService")
class ResourceAllocationDashboardServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-15T08:00:00Z");

    @Test
    @DisplayName("aggregates current allocation data")
    void aggregatesCurrentAllocationData() {
        ResourceAllocationRepository repository = mock(ResourceAllocationRepository.class);
        ResourceAllocation first = allocation("Alex Morgan", 32, 40);
        ResourceAllocation second = allocation("Sam Rivera", 44, 40);
        when(repository.findAll()).thenReturn(List.of(first, second));
        ResourceAllocationDashboardService service = service(repository);

        ResourceAllocationDashboardResponse result =
                service.getResourceAllocationDashboard();

        assertThat(result.totalResources()).isEqualTo(2);
        assertThat(result.allocatedHours()).isEqualTo(76);
        assertThat(result.capacityHours()).isEqualTo(80);
        assertThat(result.utilizationPercentage()).isEqualTo(95);
        assertThat(result.overAllocatedResources()).isEqualTo(1);
        assertThat(result.lastUpdated()).isEqualTo(NOW);
        assertThat(result.allocations())
                .extracting("utilizationStatus")
                .containsExactly("ALLOCATED", "OVER_ALLOCATED");
    }

    @Test
    @DisplayName("returns zero utilization when no capacity is available")
    void returnsZeroUtilizationForEmptyDashboard() {
        ResourceAllocationRepository repository = mock(ResourceAllocationRepository.class);
        when(repository.findAll()).thenReturn(List.of());
        ResourceAllocationDashboardService service = service(repository);

        ResourceAllocationDashboardResponse result =
                service.getResourceAllocationDashboard();

        assertThat(result.totalResources()).isZero();
        assertThat(result.utilizationPercentage()).isZero();
        assertThat(result.allocations()).isEmpty();
    }

    @Test
    @DisplayName("counts a resource once when it has multiple assignments")
    void countsDistinctResources() {
        ResourceAllocationRepository repository = mock(ResourceAllocationRepository.class);
        when(repository.findAll()).thenReturn(List.of(
                allocation("Alex Morgan", 10, 20),
                allocation("Alex Morgan", 15, 20)));
        ResourceAllocationDashboardService service = service(repository);

        ResourceAllocationDashboardResponse result =
                service.getResourceAllocationDashboard();

        assertThat(result.totalResources()).isEqualTo(1);
        assertThat(result.allocations()).hasSize(2);
        assertThat(result.allocations().get(0).utilizationStatus()).isEqualTo("AVAILABLE");
    }

    private ResourceAllocationDashboardService service(
            ResourceAllocationRepository repository) {
        return new ResourceAllocationDashboardService(
                repository,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private ResourceAllocation allocation(
            String resourceName,
            int allocatedHours,
            int capacityHours) {
        return new ResourceAllocation(
                UUID.randomUUID(),
                resourceName,
                "Engineer",
                UUID.randomUUID(),
                "Atlas",
                allocatedHours,
                capacityHours,
                NOW);
    }
}
