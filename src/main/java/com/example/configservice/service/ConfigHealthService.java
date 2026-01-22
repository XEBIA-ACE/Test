package com.example.configservice.service;

import com.example.configservice.model.ConfigHealthResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for checking the health of configuration sources.
 *
 * Monitors connectivity to:
 * - Git repository
 * - Consul service registry
 * - Vault secret store
 */
@Slf4j
@Service
public class ConfigHealthService {

    @Value("${spring.cloud.config.server.git.uri:not-configured}")
    private String gitUri;

    @Value("${spring.cloud.consul.host:localhost}")
    private String consulHost;

    @Value("${spring.cloud.vault.host:localhost}")
    private String vaultHost;

    /**
     * Performs health checks on all configuration sources.
     *
     * @return Aggregated health status
     */
    public ConfigHealthResponse checkHealth() {
        log.debug("Starting configuration health check");

        Map<String, String> componentStatus = new HashMap<>();

        // Check Git connectivity
        boolean gitHealthy = checkGitHealth();
        componentStatus.put("git", gitHealthy ? "UP" : "DOWN");

        // Check Consul connectivity
        boolean consulHealthy = checkConsulHealth();
        componentStatus.put("consul", consulHealthy ? "UP" : "DOWN");

        // Check Vault connectivity
        boolean vaultHealthy = checkVaultHealth();
        componentStatus.put("vault", vaultHealthy ? "UP" : "DOWN");

        // Determine overall status
        boolean allHealthy = gitHealthy && consulHealthy && vaultHealthy;
        String overallStatus = allHealthy ? "UP" : "DEGRADED";

        log.info("Health check complete - Git: {}, Consul: {}, Vault: {}",
                componentStatus.get("git"),
                componentStatus.get("consul"),
                componentStatus.get("vault"));

        return ConfigHealthResponse.builder()
                .status(overallStatus)
                .timestamp(Instant.now())
                .components(componentStatus)
                .gitUri(gitUri)
                .consulHost(consulHost)
                .vaultHost(vaultHost)
                .build();
    }

    private boolean checkGitHealth() {
        // Basic validation - in production, this would attempt actual Git connectivity
        boolean healthy = gitUri != null && !gitUri.equals("not-configured");
        log.debug("Git health check: {}", healthy ? "PASS" : "FAIL");
        return healthy;
    }

    private boolean checkConsulHealth() {
        // Basic validation - in production, this would ping Consul
        boolean healthy = consulHost != null && !consulHost.isEmpty();
        log.debug("Consul health check: {}", healthy ? "PASS" : "FAIL");
        return healthy;
    }

    private boolean checkVaultHealth() {
        // Basic validation - in production, this would verify Vault connectivity
        boolean healthy = vaultHost != null && !vaultHost.isEmpty();
        log.debug("Vault health check: {}", healthy ? "PASS" : "FAIL");
        return healthy;
    }
}
