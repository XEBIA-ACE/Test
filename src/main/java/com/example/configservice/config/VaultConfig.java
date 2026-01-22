package com.example.configservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Vault integration configuration.
 *
 * Provides:
 * - Integration with HashiCorp Vault for secrets management
 * - Automatic secret rotation support
 * - Encrypted property resolution
 *
 * Vault configuration is primarily done through application properties.
 * This class can be extended to add custom Vault template beans or
 * secret rotation logic.
 */
@Slf4j
@Configuration
@Profile("!test")
public class VaultConfig {

    public VaultConfig() {
        log.info("Vault configuration initialized");
        log.info("Vault integration will be configured via application properties");
    }
}
