package com.authservice.api.controller;

import com.authservice.api.dto.*;
import com.authservice.domain.service.AuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController.
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationService authenticationService;

    @Test
    void testRegister_Success() throws Exception {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("SecureP@ssw0rd")
                .firstName("Test")
                .lastName("User")
                .build();

        UserResponse response = UserResponse.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        when(authenticationService.register(any(RegisterRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void testRegister_InvalidInput() throws Exception {
        // Given - Invalid request (missing required fields)
        RegisterRequest request = RegisterRequest.builder()
                .username("ab") // Too short
                .email("invalid-email")
                .password("weak")
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testLogin_Success() throws Exception {
        // Given
        LoginRequest request = LoginRequest.builder()
                .username("testuser")
                .password("SecureP@ssw0rd")
                .build();

        AuthResponse response = AuthResponse.builder()
                .accessToken("jwt-access-token")
                .refreshToken("refresh-token-uuid")
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(UserResponse.builder()
                        .id("user-123")
                        .username("testuser")
                        .email("test@example.com")
                        .build())
                .build();

        when(authenticationService.login(any(LoginRequest.class), anyString(), anyString()))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token-uuid"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    @WithMockUser
    void testLogout_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/v1/auth/logout")
                        .with(csrf())
                        .param("sessionId", "session-123"))
                .andExpect(status().isOk());
    }

    @Test
    void testRefreshToken_Success() throws Exception {
        // Given
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("refresh-token-uuid")
                .build();

        AuthResponse response = AuthResponse.builder()
                .accessToken("new-jwt-access-token")
                .refreshToken("refresh-token-uuid")
                .tokenType("Bearer")
                .expiresIn(3600L)
                .build();

        when(authenticationService.refreshToken(any(RefreshTokenRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-jwt-access-token"));
    }

    @Test
    @WithMockUser
    void testGetCurrentUser_Success() throws Exception {
        // Given
        UserResponse response = UserResponse.builder()
                .id("user-123")
                .username("testuser")
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of("USER"))
                .enabled(true)
                .build();

        when(authenticationService.getUserById(anyString()))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/v1/auth/me")
                        .param("userId", "user-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
