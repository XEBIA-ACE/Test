package com.authservice.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
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
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {

    private final RedisTemplate<String, Object> redisTemplate;

    public HealthController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    @Operation(summary = "Health check", description = "Check service health status")
    public ResponseEntity<HealthResponse> health() {
        Map<String, String> dependencies = new HashMap<>();

        // Check Redis
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            dependencies.put("redis", "UP");
        } catch (Exception e) {
            dependencies.put("redis", "DOWN");
        }

        boolean isHealthy = dependencies.values().stream().allMatch(status -> status.equals("UP"));

        HealthResponse response = HealthResponse.builder()
                .status(isHealthy ? "UP" : "DOWN")
                .timestamp(LocalDateTime.now())
                .service("authentication-service")
                .version("1.0.0")
                .dependencies(dependencies)
                .build();

        return ResponseEntity.ok(response);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthResponse {
        private String status;
        private LocalDateTime timestamp;
        private String service;
        private String version;
        private Map<String, String> dependencies;
    }
}
