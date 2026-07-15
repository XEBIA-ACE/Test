package com.projectmanagement.domain.port.in;

import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;

/**
 * Query contract for dashboard data.
 */
public interface DashboardUseCase {

    /**
     * Returns the current resource allocation snapshot.
     *
     * @return dashboard summary and allocation rows
     */
    ResourceAllocationDashboardResponse getResourceAllocationDashboard();
}
