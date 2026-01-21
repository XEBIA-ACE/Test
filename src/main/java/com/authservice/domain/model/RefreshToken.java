package com.authservice.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Domain model representing a refresh token stored in Redis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken implements Serializable {

    private static final long serialVersionUID = 1L;

    private String token;
    private String userId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean revoked;
}
