package com.authservice.domain.service;

import com.authservice.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService.
 */
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Set test properties using reflection
        ReflectionTestUtils.setField(jwtService, "secret",
                "test-secret-key-that-is-long-enough-for-hmac-sha256-algorithm-requirements");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600000L);
        ReflectionTestUtils.setField(jwtService, "issuer", "test-auth-service");
    }

    @Test
    void testGenerateAccessToken() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .build();

        // When
        String token = jwtService.generateAccessToken(user);

        // Then
        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    void testExtractUsername() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .build();
        String token = jwtService.generateAccessToken(user);

        // When
        String username = jwtService.extractUsername(token);

        // Then
        assertEquals("testuser", username);
    }

    @Test
    void testExtractUserId() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .build();
        String token = jwtService.generateAccessToken(user);

        // When
        String userId = jwtService.extractUserId(token);

        // Then
        assertEquals("user-123", userId);
    }

    @Test
    void testValidateToken_ValidToken() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .build();
        String token = jwtService.generateAccessToken(user);

        // When
        Boolean isValid = jwtService.validateToken(token, "testuser");

        // Then
        assertTrue(isValid);
    }

    @Test
    void testValidateToken_InvalidUsername() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .build();
        String token = jwtService.generateAccessToken(user);

        // When
        Boolean isValid = jwtService.validateToken(token, "wronguser");

        // Then
        assertFalse(isValid);
    }

    @Test
    void testValidateToken_MalformedToken() {
        // Given
        String malformedToken = "invalid.jwt.token";

        // When
        Boolean isValid = jwtService.validateToken(malformedToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void testGetExpirationSeconds() {
        // When
        Long expirationSeconds = jwtService.getExpirationSeconds();

        // Then
        assertEquals(3600L, expirationSeconds);
    }
}
