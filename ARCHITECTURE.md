# Architecture Documentation

## Overview

The Authentication Service follows Clean Architecture principles with clear separation between layers, ensuring maintainability, testability, and scalability.

## Architecture Layers

### 1. API Layer (`api/`)
**Responsibility**: Handle HTTP communication

- **Controllers**: REST endpoints that receive HTTP requests
- **DTOs**: Data Transfer Objects for request/response
- **Exception Handlers**: Global exception handling and error responses

**Key Components**:
- `AuthController`: Main authentication endpoints
- `HealthController`: Service health monitoring
- `GlobalExceptionHandler`: Centralized error handling

### 2. Domain Layer (`domain/`)
**Responsibility**: Business logic and domain models

- **Models**: Core business entities
- **Services**: Business logic implementation
- **Exceptions**: Domain-specific exceptions

**Key Components**:
- `User`, `Session`, `RefreshToken`: Domain models
- `AuthenticationService`: Main business logic
- `JwtService`: Token generation and validation
- `KeycloakService`: External authentication provider integration
- `RefreshTokenService`: Token lifecycle management

### 3. Infrastructure Layer (`infrastructure/`)
**Responsibility**: External integrations and technical concerns

- **Repositories**: Data access layer
- **Config**: Application configuration
- **Security**: Security filters and configuration

**Key Components**:
- `UserRepository`, `SessionRepository`: Redis data access
- `SecurityConfig`: Spring Security configuration
- `RedisConfig`: Redis connection and serialization
- `JwtAuthenticationFilter`: JWT token validation filter

## Data Flow

### Registration Flow
```
Client Request
    ↓
AuthController.register()
    ↓
AuthenticationService.register()
    ↓
1. KeycloakService.createUser() → Create user in Keycloak
2. UserRepository.save() → Store user in Redis
    ↓
Return UserResponse
```

### Login Flow
```
Client Request (username/password)
    ↓
AuthController.login()
    ↓
AuthenticationService.login()
    ↓
1. KeycloakService.authenticate() → Validate credentials with Keycloak
2. JwtService.generateAccessToken() → Generate JWT
3. RefreshTokenService.createRefreshToken() → Generate refresh token
4. SessionRepository.save() → Store session in Redis
    ↓
Return AuthResponse (tokens + user info)
```

### Protected Endpoint Access
```
Client Request (with Bearer token)
    ↓
JwtAuthenticationFilter.doFilterInternal()
    ↓
1. Extract JWT from Authorization header
2. JwtService.validateToken() → Validate token
3. Extract user info and roles
4. Set SecurityContext authentication
    ↓
Controller method (with authenticated user)
```

### Token Refresh Flow
```
Client Request (with refresh token)
    ↓
AuthController.refreshToken()
    ↓
AuthenticationService.refreshToken()
    ↓
1. RefreshTokenService.findByToken() → Get refresh token from Redis
2. RefreshTokenService.verifyExpiration() → Verify not expired/revoked
3. JwtService.generateAccessToken() → Generate new JWT
    ↓
Return AuthResponse (new access token)
```

## Technology Decisions

### Why Redis?
- **Fast session lookups**: In-memory storage for quick access
- **Automatic expiration**: Built-in TTL for sessions and tokens
- **Scalability**: Easy to scale horizontally
- **Session sharing**: Multiple service instances can share sessions

### Why Keycloak?
- **Enterprise-grade**: Production-ready identity management
- **OAuth 2.0 compliance**: Standard protocol implementation
- **User management**: Built-in user administration
- **Extensibility**: Supports custom authentication flows

### Why JWT?
- **Stateless**: No server-side session storage needed
- **Self-contained**: Token includes all necessary claims
- **Standard**: Industry-standard token format
- **Portable**: Works across different platforms

## Security Considerations

### Password Security
- Passwords validated with strict requirements (length, complexity)
- Passwords stored in Keycloak (BCrypt hashing)
- Never stored or logged in plain text

### Token Security
- JWT signed with HMAC-SHA256
- Short-lived access tokens (1 hour default)
- Longer-lived refresh tokens (24 hours default)
- Refresh tokens stored in Redis with automatic expiration
- Token revocation support via Redis

### Session Security
- Sessions stored with TTL in Redis
- Session binding to IP address and user agent
- Multiple session support per user
- Logout invalidates session and revokes refresh token

### API Security
- CSRF protection enabled
- CORS properly configured
- Rate limiting (can be added via Spring Cloud Gateway)
- Input validation on all endpoints
- Error responses don't leak sensitive information

## Scalability

### Horizontal Scaling
- Stateless application design
- Session data in Redis (shared across instances)
- JWT tokens eliminate sticky sessions
- Load balancer friendly

### Performance Optimization
- Redis caching reduces database calls
- JWT reduces server-side validation
- Connection pooling for Redis
- Async operations where applicable

### Monitoring
- Health checks for dependencies
- Prometheus metrics
- Structured logging
- Request/response logging

## Database Schema (Redis)

### Key Patterns

**User Keys**:
```
user:{userId} → User object
user:email:{email} → userId
user:username:{username} → userId
```

**Session Keys**:
```
session:{sessionId} → Session object
user:sessions:{userId} → Set of sessionIds
```

**Refresh Token Keys**:
```
refresh_token:{token} → RefreshToken object
```

### TTL Strategy
- Users: 30 days (refreshed on activity)
- Sessions: 30 minutes (configurable)
- Refresh tokens: 24 hours (configurable)

## Error Handling

### Exception Hierarchy
```
RuntimeException
├── AuthenticationException → 401 Unauthorized
├── UserAlreadyExistsException → 409 Conflict
├── TokenRefreshException → 403 Forbidden
├── KeycloakException → 500 Internal Server Error
└── AccessDeniedException → 403 Forbidden
```

### Error Response Format
```json
{
  "timestamp": "2025-01-21T10:15:30",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid input",
  "path": "/api/v1/auth/login",
  "validationErrors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

## Testing Strategy

### Unit Tests
- Service layer logic
- JWT token generation/validation
- Utility functions

### Integration Tests
- Controller endpoints
- Repository operations
- Security configuration

### Test Coverage Goals
- Service layer: >90%
- Controller layer: >85%
- Repository layer: >80%
- Overall: >85%

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Load Balancer / API Gateway     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│  Auth Service  │  │  Auth Service │
│   Instance 1   │  │   Instance 2  │
└───────┬────────┘  └──────┬────────┘
        │                   │
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│     Redis      │  │   Keycloak    │
│   (Sessions)   │  │    (Users)    │
└────────────────┘  └───────────────┘
```

## Future Enhancements

### Planned Features
1. **Email Verification**: Send verification emails on registration
2. **Password Reset**: Forgot password flow
3. **2FA Support**: Two-factor authentication
4. **OAuth Providers**: Google, GitHub, etc.
5. **Rate Limiting**: Prevent brute force attacks
6. **Audit Logging**: Track authentication events
7. **Session Management UI**: View and revoke active sessions
8. **Password History**: Prevent password reuse

### Performance Improvements
1. **Caching Strategy**: Cache user data with Redis
2. **Database Support**: Add PostgreSQL for audit logs
3. **Async Processing**: Background jobs for cleanup
4. **Connection Pooling**: Optimize Redis connections

### Observability Enhancements
1. **Distributed Tracing**: Add Zipkin/Jaeger
2. **Custom Metrics**: Business-specific metrics
3. **Alerting**: Integration with monitoring systems
4. **Dashboard**: Grafana dashboards for metrics
