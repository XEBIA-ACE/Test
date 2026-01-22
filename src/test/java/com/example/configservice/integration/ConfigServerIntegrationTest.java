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
 * Integration tests for Spring Cloud Config Server endpoints.
 *
 * Tests configuration retrieval from Git repository.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConfigServerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "testuser", roles = {"USER", "ADMIN"})
    void getConfiguration_withValidApplication_returnsConfig() throws Exception {
        // Test retrieving configuration for a sample application
        // Using the default Git repo: https://github.com/spring-cloud-samples/config-repo
        mockMvc.perform(get("/foo/development"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("foo"))
                .andExpect(jsonPath("$.profiles").isArray());
    }

    @Test
    void getConfiguration_withoutAuthentication_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/foo/development"))
                .andExpect(status().isUnauthorized());
    }
}
