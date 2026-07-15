package com.projectmanagement.web.controller;

import com.projectmanagement.domain.port.in.DashboardUseCase;
import com.projectmanagement.web.dto.ResourceAllocationDashboardResponse;
import com.projectmanagement.web.dto.ResourceAllocationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@DisplayName("DashboardController")
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardUseCase dashboardUseCase;

    @Test
    @DisplayName("returns a non-cacheable real-time resource allocation snapshot")
    void returnsResourceAllocationSnapshot() throws Exception {
        Instant updatedAt = Instant.parse("2026-07-15T08:00:00Z");
        ResourceAllocationResponse allocation = new ResourceAllocationResponse(
                UUID.randomUUID(),
                "Alex Morgan",
                "Engineer",
                UUID.randomUUID(),
                "Atlas",
                32,
                40,
                80,
                "ALLOCATED",
                updatedAt);
        when(dashboardUseCase.getResourceAllocationDashboard()).thenReturn(
                new ResourceAllocationDashboardResponse(
                        1,
                        32,
                        40,
                        80,
                        0,
                        updatedAt,
                        List.of(allocation)));

        mockMvc.perform(get("/api/v1/dashboard/resource-allocation"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.totalResources", is(1)))
                .andExpect(jsonPath("$.utilizationPercentage", is(80.0)))
                .andExpect(jsonPath("$.allocations[0].resourceName", is("Alex Morgan")))
                .andExpect(jsonPath("$.allocations[0].utilizationStatus", is("ALLOCATED")));
    }
}
