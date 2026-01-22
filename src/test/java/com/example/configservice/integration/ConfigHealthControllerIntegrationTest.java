package com.example.configservice.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ConfigHealthController.
 *
 * Tests the REST endpoints with security and full application context.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConfigHealthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "testuser", roles = {"USER", "ADMIN"})
    void checkHealth_withAuthentication_returnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/config/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.components").exists())
                .andExpect(jsonPath("$.components.git").exists())
                .andExpect(jsonPath("$.components.consul").exists())
                .andExpect(jsonPath("$.components.vault").exists());
    }

    @Test
    void checkHealth_withoutAuthentication_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/config/health"))
                .andExpect(status().isUnauthorized());
    }
}
