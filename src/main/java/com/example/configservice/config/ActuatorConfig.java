package com.example.configservice.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Actuator and monitoring configuration.
 *
 * Configures:
 * - Micrometer metrics
 * - Custom metrics support
 * - Prometheus endpoint
 * - Timing aspects for method monitoring
 */
@Slf4j
@Configuration
public class ActuatorConfig {

    /**
     * Enables @Timed annotation for method-level metrics.
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        log.info("Configuring timed aspect for metrics collection");
        return new TimedAspect(registry);
    }
}
