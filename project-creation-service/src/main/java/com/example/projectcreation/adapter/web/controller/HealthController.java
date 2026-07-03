package com.example.projectcreation.adapter.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health-check endpoint.
 * Returns HTTP 200 with a simple JSON body so load-balancers and
 * orchestrators can verify the service is alive.
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    /**
     * GET /health — liveness probe.
     *
     * @return {@code {"status": "UP"}}
     */
    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
