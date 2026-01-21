package com.authservice.domain.service;

import com.authservice.domain.exception.TokenRefreshException;
import com.authservice.domain.model.RefreshToken;
import com.authservice.infrastructure.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for managing refresh tokens.
 * Handles creation, validation, and revocation of refresh tokens.
 */
@Service
@Slf4j
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration-ms}")
    private Long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Create a new refresh token for the user.
     */
    public RefreshToken createRefreshToken(String userId) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .createdAt(LocalDateTime.now())
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Find refresh token by token string.
     */
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));
    }

    /**
     * Verify if refresh token is valid and not expired.
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.deleteByToken(token.getToken());
            throw new TokenRefreshException("Refresh token has expired. Please login again.");
        }

        if (token.isRevoked()) {
            throw new TokenRefreshException("Refresh token has been revoked. Please login again.");
        }

        return token;
    }

    /**
     * Revoke a refresh token.
     */
    public void revokeToken(String token) {
        RefreshToken refreshToken = findByToken(token);
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        log.info("Refresh token revoked: {}", token);
    }

    /**
     * Delete a refresh token.
     */
    public void deleteToken(String token) {
        refreshTokenRepository.deleteByToken(token);
        log.info("Refresh token deleted: {}", token);
    }
}
