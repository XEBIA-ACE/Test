package com.example.configservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration test for the main application context.
 *
 * Verifies that the Spring application context loads successfully
 * with all required beans and configurations.
 */
@SpringBootTest
@ActiveProfiles("test")
class ConfigServiceApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the application context loads successfully
        // If there are any configuration issues, this test will fail
    }
}
