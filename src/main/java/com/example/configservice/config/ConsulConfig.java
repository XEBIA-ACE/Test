package com.example.configservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.consul.serviceregistry.ConsulAutoRegistration;
import org.springframework.cloud.consul.serviceregistry.ConsulRegistrationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Consul integration configuration.
 *
 * Configures:
 * - Service registration with Consul
 * - Health check endpoints
 * - Service metadata
 * - Custom registration properties
 */
@Slf4j
@Configuration
@Profile("!test")
public class ConsulConfig {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${server.port}")
    private int serverPort;

    /**
     * Customizes the Consul service registration.
     * Adds metadata and configures health check intervals.
     */
    @Bean
    public ConsulRegistrationCustomizer consulRegistrationCustomizer() {
        return registration -> {
            log.info("Customizing Consul registration for service: {}", applicationName);

            // Add custom metadata
            registration.getService().getMeta().put("version", "1.0.0");
            registration.getService().getMeta().put("type", "config-server");

            // Configure health check
            registration.getService().getCheck().setInterval("10s");
            registration.getService().getCheck().setTimeout("5s");

            log.info("Consul registration customized successfully");
        };
    }
}
