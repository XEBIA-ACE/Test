package com.example.configservice.controller;

import com.example.configservice.model.ConfigHealthResponse;
import com.example.configservice.service.ConfigHealthService;
import io.micrometer.core.annotation.Timed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for configuration health checks.
 *
 * Provides endpoints to verify:
 * - Git repository connectivity
 * - Consul connectivity
 * - Vault connectivity
 * - Overall service health
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
public class ConfigHealthController {

    private final ConfigHealthService configHealthService;

    /**
     * Checks the health of all configuration sources.
     *
     * @return Health status of Git, Consul, and Vault connections
     */
    @GetMapping("/health")
    @Timed(value = "config.health.check", description = "Time taken to check config health")
    public ResponseEntity<ConfigHealthResponse> checkHealth() {
        log.debug("Received config health check request");

        ConfigHealthResponse health = configHealthService.checkHealth();

        log.info("Config health check completed - Status: {}", health.getStatus());

        return ResponseEntity.ok(health);
    }
}
