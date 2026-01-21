package com.authservice.infrastructure.repository;

import com.authservice.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for UserRepository.
 * Note: These tests require Redis to be running.
 * In a real environment, use Testcontainers for Redis.
 */
@SpringBootTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @BeforeEach
    void setUp() {
        // Clean up Redis before each test
        redisTemplate.getConnectionFactory().getConnection().flushDb();
    }

    @Test
    void testSaveAndFindById() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        // When
        userRepository.save(user);
        Optional<User> found = userRepository.findById("user-123");

        // Then
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getUsername());
        assertEquals("test@example.com", found.get().getEmail());
    }

    @Test
    void testFindByUsername() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        // When
        userRepository.save(user);
        Optional<User> found = userRepository.findByUsername("testuser");

        // Then
        assertTrue(found.isPresent());
        assertEquals("user-123", found.get().getId());
    }

    @Test
    void testFindByEmail() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        // When
        userRepository.save(user);
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertTrue(found.isPresent());
        assertEquals("user-123", found.get().getId());
    }

    @Test
    void testExistsByUsername() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        // When
        userRepository.save(user);
        boolean exists = userRepository.existsByUsername("testuser");
        boolean notExists = userRepository.existsByUsername("nonexistent");

        // Then
        assertTrue(exists);
        assertFalse(notExists);
    }

    @Test
    void testDeleteById() {
        // Given
        User user = User.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        // When
        userRepository.save(user);
        userRepository.deleteById("user-123");
        Optional<User> found = userRepository.findById("user-123");

        // Then
        assertFalse(found.isPresent());
    }
}
