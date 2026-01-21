package com.authservice.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login request with username and password")
public class LoginRequest {

    @NotBlank(message = "Username is required")
    @Schema(description = "Username or email", example = "john.doe")
    private String username;

    @NotBlank(message = "Password is required")
    @Schema(description = "User password", example = "SecureP@ssw0rd")
    private String password;
}
