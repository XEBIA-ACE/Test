package com.projectmanagement.web.controller;

import com.projectmanagement.domain.port.in.DashboardUseCase;
import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for project management dashboards.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardUseCase dashboardUseCase;

    public DashboardController(DashboardUseCase dashboardUseCase) {
        this.dashboardUseCase = dashboardUseCase;
    }

    @GetMapping("/resource-allocation")
    public ResponseEntity<ResourceAllocationDashboardResponse> getResourceAllocation() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(dashboardUseCase.getResourceAllocationDashboard());
    }
}
