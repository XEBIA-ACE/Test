package com.projectmanagement.domain.port.in;

import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;

/**
 * Query contract for dashboard data.
 */
public interface DashboardUseCase {

    ResourceAllocationDashboardResponse getResourceAllocationDashboard();
}
