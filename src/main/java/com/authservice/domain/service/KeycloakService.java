package com.authservice.domain.service;

import com.authservice.api.dto.RegisterRequest;
import com.authservice.domain.exception.AuthenticationException;
import com.authservice.domain.exception.KeycloakException;
import com.authservice.domain.model.User;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for integrating with Keycloak for user management and authentication.
 * Handles user creation, authentication, and user data retrieval from Keycloak.
 */
@Service
@Slf4j
public class KeycloakService {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${keycloak.credentials.secret}")
    private String clientSecret;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Create a new user in Keycloak.
     */
    public String createUser(RegisterRequest request) {
        try {
            Keycloak keycloak = getKeycloakInstance();
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Create user representation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEnabled(true);
            user.setEmailVerified(false);

            // Create user
            Response response = usersResource.create(user);

            if (response.getStatus() == 201) {
                String userId = extractUserIdFromLocation(response.getLocation().getPath());

                // Set password
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType(CredentialRepresentation.PASSWORD);
                credential.setValue(request.getPassword());
                credential.setTemporary(false);

                usersResource.get(userId).resetPassword(credential);

                log.info("User created in Keycloak: {}", request.getUsername());
                keycloak.close();
                return userId;
            } else {
                keycloak.close();
                throw new KeycloakException("Failed to create user in Keycloak: " + response.getStatusInfo());
            }
        } catch (Exception e) {
            log.error("Error creating user in Keycloak: {}", e.getMessage());
            throw new KeycloakException("Failed to create user in Keycloak", e);
        }
    }

    /**
     * Authenticate user with Keycloak and return access token.
     */
    public String authenticate(String username, String password) {
        try {
            String tokenEndpoint = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "password");
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("username", username);
            body.add("password", password);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            } else {
                throw new AuthenticationException("Authentication failed");
            }
        } catch (Exception e) {
            log.error("Keycloak authentication failed: {}", e.getMessage());
            throw new AuthenticationException("Invalid credentials");
        }
    }

    /**
     * Get user by username from Keycloak.
     */
    public User getUserByUsername(String username) {
        try {
            Keycloak keycloak = getKeycloakInstance();
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            List<UserRepresentation> users = usersResource.search(username, true);

            if (users.isEmpty()) {
                keycloak.close();
                throw new AuthenticationException("User not found in Keycloak");
            }

            UserRepresentation keycloakUser = users.get(0);

            // Get user roles
            Set<String> roles = usersResource.get(keycloakUser.getId())
                    .roles()
                    .realmLevel()
                    .listAll()
                    .stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toSet());

            keycloak.close();

            return User.builder()
                    .id(keycloakUser.getId())
                    .username(keycloakUser.getUsername())
                    .email(keycloakUser.getEmail())
                    .firstName(keycloakUser.getFirstName())
                    .lastName(keycloakUser.getLastName())
                    .roles(roles.isEmpty() ? Set.of("USER") : roles)
                    .enabled(keycloakUser.isEnabled())
                    .emailVerified(keycloakUser.isEmailVerified())
                    .createdAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Error fetching user from Keycloak: {}", e.getMessage());
            throw new KeycloakException("Failed to fetch user from Keycloak", e);
        }
    }

    /**
     * Get Keycloak admin client instance.
     */
    private Keycloak getKeycloakInstance() {
        return KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm(realm)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .username(adminUsername)
                .password(adminPassword)
                .build();
    }

    /**
     * Extract user ID from location header.
     */
    private String extractUserIdFromLocation(String location) {
        String[] parts = location.split("/");
        return parts[parts.length - 1];
    }
}
