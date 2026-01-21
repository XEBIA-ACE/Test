package com.authservice.domain.service;

import com.authservice.api.dto.*;
import com.authservice.domain.exception.AuthenticationException;
import com.authservice.domain.exception.UserAlreadyExistsException;
import com.authservice.domain.model.RefreshToken;
import com.authservice.domain.model.Session;
import com.authservice.domain.model.User;
import com.authservice.infrastructure.repository.SessionRepository;
import com.authservice.infrastructure.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Main authentication service handling user registration, login, logout,
 * and token refresh operations.
 */
@Service
@Slf4j
public class AuthenticationService {

    @Value("${session.timeout-seconds}")
    private Long sessionTimeoutSeconds;

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final KeycloakService keycloakService;

    public AuthenticationService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            KeycloakService keycloakService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.keycloakService = keycloakService;
    }

    /**
     * Register a new user in both Keycloak and local storage.
     */
    public UserResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // Check if user already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        // Create user in Keycloak
        String keycloakUserId = keycloakService.createUser(request);

        // Create user in local storage
        User user = User.builder()
                .id(keycloakUserId)
                .username(request.getUsername())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roles(Set.of("USER"))
                .enabled(true)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());

        return mapToUserResponse(user);
    }

    /**
     * Authenticate user and create session with tokens.
     */
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("User login attempt: {}", request.getUsername());

        // Authenticate with Keycloak
        String keycloakAccessToken = keycloakService.authenticate(request.getUsername(), request.getPassword());

        // Get or create user in local storage
        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> {
                    // Fetch user from Keycloak and create locally
                    User keycloakUser = keycloakService.getUserByUsername(request.getUsername());
                    return userRepository.save(keycloakUser);
                });

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT tokens
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        // Create session
        Session session = Session.builder()
                .sessionId(UUID.randomUUID().toString())
                .userId(user.getId())
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusSeconds(sessionTimeoutSeconds))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .active(true)
                .build();

        sessionRepository.save(session);

        log.info("User logged in successfully: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationSeconds())
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Logout user and invalidate session.
     */
    public void logout(String sessionId) {
        log.info("User logout: sessionId={}", sessionId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AuthenticationException("Session not found"));

        // Revoke refresh token
        refreshTokenService.revokeToken(session.getRefreshToken());

        // Delete session
        sessionRepository.deleteById(sessionId);

        log.info("User logged out successfully: sessionId={}", sessionId);
    }

    /**
     * Refresh access token using refresh token.
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Refreshing access token");

        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        // Get user
        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new AuthenticationException("User not found"));

        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user);

        log.info("Access token refreshed for user: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationSeconds())
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Get user by ID.
     */
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        return mapToUserResponse(user);
    }

    /**
     * Logout all sessions for a user.
     */
    public void logoutAllSessions(String userId) {
        log.info("Logging out all sessions for user: {}", userId);
        sessionRepository.deleteAllByUserId(userId);
    }

    /**
     * Map User entity to UserResponse DTO.
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
