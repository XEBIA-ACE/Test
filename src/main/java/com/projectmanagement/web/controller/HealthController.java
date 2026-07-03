package com.projectmanagement.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health check endpoint — used by load balancers and container orchestrators.
 */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = Map.of(
                "status", "UP",
                "service", "ProjectManagementService",
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(body);
    }
}
