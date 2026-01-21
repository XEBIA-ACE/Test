package com.authservice.infrastructure.repository;

import com.authservice.domain.model.Session;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Repository for managing Session entities in Redis.
 */
@Repository
public class SessionRepository {

    private static final String SESSION_KEY_PREFIX = "session:";
    private static final String USER_SESSIONS_KEY_PREFIX = "user:sessions:";

    private final RedisTemplate<String, Object> redisTemplate;

    public SessionRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public Session save(Session session) {
        String sessionKey = SESSION_KEY_PREFIX + session.getSessionId();
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + session.getUserId();

        // Calculate TTL based on expiration time
        long ttlSeconds = Duration.between(LocalDateTime.now(), session.getExpiresAt()).getSeconds();
        Duration ttl = Duration.ofSeconds(Math.max(ttlSeconds, 0));

        // Store session
        redisTemplate.opsForValue().set(sessionKey, session, ttl);

        // Add session ID to user's session set
        redisTemplate.opsForSet().add(userSessionsKey, session.getSessionId());
        redisTemplate.expire(userSessionsKey, ttl);

        return session;
    }

    public Optional<Session> findById(String sessionId) {
        String key = SESSION_KEY_PREFIX + sessionId;
        Object result = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable((Session) result);
    }

    public Set<Session> findByUserId(String userId) {
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + userId;
        Set<Object> sessionIds = redisTemplate.opsForSet().members(userSessionsKey);

        if (sessionIds == null || sessionIds.isEmpty()) {
            return Set.of();
        }

        return sessionIds.stream()
                .map(id -> findById((String) id))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
    }

    public void deleteById(String sessionId) {
        Optional<Session> session = findById(sessionId);
        if (session.isPresent()) {
            Session s = session.get();
            redisTemplate.delete(SESSION_KEY_PREFIX + sessionId);
            redisTemplate.opsForSet().remove(USER_SESSIONS_KEY_PREFIX + s.getUserId(), sessionId);
        }
    }

    public void deleteAllByUserId(String userId) {
        Set<Session> sessions = findByUserId(userId);
        sessions.forEach(session -> deleteById(session.getSessionId()));
        redisTemplate.delete(USER_SESSIONS_KEY_PREFIX + userId);
    }
}
