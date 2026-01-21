package com.authservice.infrastructure.repository;

import com.authservice.domain.model.RefreshToken;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for managing RefreshToken entities in Redis.
 */
@Repository
public class RefreshTokenRepository {

    private static final String REFRESH_TOKEN_KEY_PREFIX = "refresh_token:";

    private final RedisTemplate<String, Object> redisTemplate;

    public RefreshTokenRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public RefreshToken save(RefreshToken refreshToken) {
        String key = REFRESH_TOKEN_KEY_PREFIX + refreshToken.getToken();

        // Calculate TTL based on expiration time
        long ttlSeconds = Duration.between(LocalDateTime.now(), refreshToken.getExpiresAt()).getSeconds();
        Duration ttl = Duration.ofSeconds(Math.max(ttlSeconds, 0));

        redisTemplate.opsForValue().set(key, refreshToken, ttl);
        return refreshToken;
    }

    public Optional<RefreshToken> findByToken(String token) {
        String key = REFRESH_TOKEN_KEY_PREFIX + token;
        Object result = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable((RefreshToken) result);
    }

    public void deleteByToken(String token) {
        String key = REFRESH_TOKEN_KEY_PREFIX + token;
        redisTemplate.delete(key);
    }

    public boolean existsByToken(String token) {
        String key = REFRESH_TOKEN_KEY_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
