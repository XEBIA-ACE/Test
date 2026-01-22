package com.example.configservice.unit;

import com.example.configservice.model.ConfigHealthResponse;
import com.example.configservice.service.ConfigHealthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ConfigHealthService.
 *
 * Tests the health check logic for configuration sources.
 */
@ExtendWith(MockitoExtension.class)
class ConfigHealthServiceTest {

    @InjectMocks
    private ConfigHealthService configHealthService;

    @BeforeEach
    void setUp() {
        // Set test values using reflection to simulate application properties
        ReflectionTestUtils.setField(configHealthService, "gitUri",
            "https://github.com/test/config-repo.git");
        ReflectionTestUtils.setField(configHealthService, "consulHost", "localhost");
        ReflectionTestUtils.setField(configHealthService, "vaultHost", "localhost");
    }

    @Test
    void checkHealth_withValidConfig_returnsHealthyStatus() {
        // When
        ConfigHealthResponse response = configHealthService.checkHealth();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("UP");
        assertThat(response.getComponents()).containsKeys("git", "consul", "vault");
        assertThat(response.getComponents().get("git")).isEqualTo("UP");
        assertThat(response.getComponents().get("consul")).isEqualTo("UP");
        assertThat(response.getComponents().get("vault")).isEqualTo("UP");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void checkHealth_withInvalidGitUri_returnsDegradedStatus() {
        // Given
        ReflectionTestUtils.setField(configHealthService, "gitUri", "not-configured");

        // When
        ConfigHealthResponse response = configHealthService.checkHealth();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("DEGRADED");
        assertThat(response.getComponents().get("git")).isEqualTo("DOWN");
    }

    @Test
    void checkHealth_includesConfigurationDetails() {
        // When
        ConfigHealthResponse response = configHealthService.checkHealth();

        // Then
        assertThat(response.getGitUri()).isEqualTo("https://github.com/test/config-repo.git");
        assertThat(response.getConsulHost()).isEqualTo("localhost");
        assertThat(response.getVaultHost()).isEqualTo("localhost");
    }
}
