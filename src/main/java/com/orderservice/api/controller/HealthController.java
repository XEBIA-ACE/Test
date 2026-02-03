package com.orderservice.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for monitoring service status.
 */
@RestController
@RequestMapping("/api/v1")
@Slf4j
@Tag(name = "Health", description = "Health check and service information endpoints")
public class HealthController {

    @Value("${application.name:Order Management Service}")
    private String applicationName;

    @Value("${application.version:1.0.0}")
    private String applicationVersion;

    /**
     * Basic health check endpoint.
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns the health status of the service")
    public ResponseEntity<HealthResponse> health() {
        log.debug("Health check requested");

        HealthResponse response = new HealthResponse(
            "UP",
            LocalDateTime.now(),
            applicationName,
            applicationVersion
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Detailed service information endpoint.
     */
    @GetMapping("/info")
    @Operation(summary = "Service information", description = "Returns detailed service information")
    public ResponseEntity<Map<String, Object>> info() {
        log.debug("Service info requested");

        Map<String, Object> info = new HashMap<>();
        info.put("name", applicationName);
        info.put("version", applicationVersion);
        info.put("description", "Production-ready order management service");
        info.put("timestamp", LocalDateTime.now());

        Map<String, String> runtime = new HashMap<>();
        runtime.put("javaVersion", System.getProperty("java.version"));
        runtime.put("javaVendor", System.getProperty("java.vendor"));
        info.put("runtime", runtime);

        return ResponseEntity.ok(info);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class HealthResponse {
        private String status;
        private LocalDateTime timestamp;
        private String service;
        private String version;
    }
}
