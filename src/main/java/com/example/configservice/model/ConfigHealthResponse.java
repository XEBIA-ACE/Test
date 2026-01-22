package com.example.configservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Response model for configuration health status.
 *
 * Contains status information for all integrated components.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigHealthResponse {

    /**
     * Overall health status: UP, DEGRADED, or DOWN
     */
    private String status;

    /**
     * Timestamp of the health check
     */
    private Instant timestamp;

    /**
     * Status of individual components (git, consul, vault)
     */
    private Map<String, String> components;

    /**
     * Git repository URI
     */
    private String gitUri;

    /**
     * Consul host
     */
    private String consulHost;

    /**
     * Vault host
     */
    private String vaultHost;
}
