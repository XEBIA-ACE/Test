package com.authservice.infrastructure.repository;

import com.authservice.domain.model.User;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

/**
 * Repository for managing User entities in Redis.
 */
@Repository
public class UserRepository {

    private static final String USER_KEY_PREFIX = "user:";
    private static final String USER_EMAIL_KEY_PREFIX = "user:email:";
    private static final String USER_USERNAME_KEY_PREFIX = "user:username:";
    private static final Duration USER_TTL = Duration.ofDays(30);

    private final RedisTemplate<String, Object> redisTemplate;

    public UserRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public User save(User user) {
        String userKey = USER_KEY_PREFIX + user.getId();
        String emailKey = USER_EMAIL_KEY_PREFIX + user.getEmail();
        String usernameKey = USER_USERNAME_KEY_PREFIX + user.getUsername();

        // Store user by ID
        redisTemplate.opsForValue().set(userKey, user, USER_TTL);

        // Store ID mappings for lookup by email and username
        redisTemplate.opsForValue().set(emailKey, user.getId(), USER_TTL);
        redisTemplate.opsForValue().set(usernameKey, user.getId(), USER_TTL);

        return user;
    }

    public Optional<User> findById(String id) {
        String key = USER_KEY_PREFIX + id;
        Object result = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable((User) result);
    }

    public Optional<User> findByEmail(String email) {
        String emailKey = USER_EMAIL_KEY_PREFIX + email;
        String userId = (String) redisTemplate.opsForValue().get(emailKey);

        if (userId != null) {
            return findById(userId);
        }
        return Optional.empty();
    }

    public Optional<User> findByUsername(String username) {
        String usernameKey = USER_USERNAME_KEY_PREFIX + username;
        String userId = (String) redisTemplate.opsForValue().get(usernameKey);

        if (userId != null) {
            return findById(userId);
        }
        return Optional.empty();
    }

    public boolean existsByEmail(String email) {
        String key = USER_EMAIL_KEY_PREFIX + email;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public boolean existsByUsername(String username) {
        String key = USER_USERNAME_KEY_PREFIX + username;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void deleteById(String id) {
        Optional<User> user = findById(id);
        if (user.isPresent()) {
            User u = user.get();
            redisTemplate.delete(USER_KEY_PREFIX + id);
            redisTemplate.delete(USER_EMAIL_KEY_PREFIX + u.getEmail());
            redisTemplate.delete(USER_USERNAME_KEY_PREFIX + u.getUsername());
        }
    }
}
