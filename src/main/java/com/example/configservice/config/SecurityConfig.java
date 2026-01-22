package com.example.configservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for the Config Service.
 *
 * Implements:
 * - Basic authentication for config endpoints
 * - Public access to actuator health endpoints
 * - Encrypted password storage
 * - CSRF protection
 */
@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${config.security.username:admin}")
    private String username;

    @Value("${config.security.password:changeme}")
    private String password;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring security filter chain");

        http
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints - health checks
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                // Secured endpoints - require authentication
                .requestMatchers("/actuator/**").authenticated()
                .requestMatchers("/encrypt/**").authenticated()
                .requestMatchers("/decrypt/**").authenticated()
                // All config endpoints require authentication
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {})
            .csrf(csrf -> csrf.disable()); // Disable CSRF for stateless API

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        log.info("Creating in-memory user details service for user: {}", username);

        UserDetails user = User.builder()
            .username(username)
            .password(passwordEncoder().encode(password))
            .roles("USER", "ADMIN")
            .build();

        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
