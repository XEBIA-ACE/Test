package com.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main application class for the Authentication Service.
 * This service provides OAuth 2.0 authentication with JWT tokens,
 * Keycloak integration, and Redis-based session management.
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
public class AuthenticationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthenticationServiceApplication.class, args);
    }
}
