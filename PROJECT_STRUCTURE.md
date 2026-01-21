# Project Structure

```
authentication-service/
├── src/
│   ├── main/
│   │   ├── java/com/authservice/
│   │   │   ├── AuthenticationServiceApplication.java    # Main application class
│   │   │   │
│   │   │   ├── api/                                     # API Layer
│   │   │   │   ├── controller/                          # REST Controllers
│   │   │   │   │   ├── AuthController.java             # Authentication endpoints
│   │   │   │   │   └── HealthController.java           # Health check endpoint
│   │   │   │   │
│   │   │   │   ├── dto/                                 # Data Transfer Objects
│   │   │   │   │   ├── LoginRequest.java               # Login request DTO
│   │   │   │   │   ├── RegisterRequest.java            # Registration request DTO
│   │   │   │   │   ├── RefreshTokenRequest.java        # Token refresh request DTO
│   │   │   │   │   ├── AuthResponse.java               # Authentication response DTO
│   │   │   │   │   ├── UserResponse.java               # User information response DTO
│   │   │   │   │   └── ErrorResponse.java              # Error response DTO
│   │   │   │   │
│   │   │   │   └── exception/                           # Exception Handlers
│   │   │   │       └── GlobalExceptionHandler.java     # Global exception handler
│   │   │   │
│   │   │   ├── domain/                                  # Domain Layer
│   │   │   │   ├── model/                               # Domain Models
│   │   │   │   │   ├── User.java                       # User entity
│   │   │   │   │   ├── Session.java                    # Session entity
│   │   │   │   │   └── RefreshToken.java               # Refresh token entity
│   │   │   │   │
│   │   │   │   ├── service/                             # Business Logic Services
│   │   │   │   │   ├── AuthenticationService.java      # Main authentication service
│   │   │   │   │   ├── JwtService.java                 # JWT token service
│   │   │   │   │   ├── RefreshTokenService.java        # Refresh token service
│   │   │   │   │   └── KeycloakService.java            # Keycloak integration service
│   │   │   │   │
│   │   │   │   └── exception/                           # Domain Exceptions
│   │   │   │       ├── AuthenticationException.java    # Authentication failure exception
│   │   │   │       ├── UserAlreadyExistsException.java # User exists exception
│   │   │   │       ├── TokenRefreshException.java      # Token refresh exception
│   │   │   │       └── KeycloakException.java          # Keycloak operation exception
│   │   │   │
│   │   │   └── infrastructure/                          # Infrastructure Layer
│   │   │       ├── config/                              # Configuration Classes
│   │   │       │   ├── SecurityConfig.java             # Spring Security config
│   │   │       │   ├── RedisConfig.java                # Redis configuration
│   │   │       │   ├── OpenApiConfig.java              # Swagger/OpenAPI config
│   │   │       │   └── CorsProperties.java             # CORS properties
│   │   │       │
│   │   │       ├── repository/                          # Data Access Layer
│   │   │       │   ├── UserRepository.java             # User Redis repository
│   │   │       │   ├── SessionRepository.java          # Session Redis repository
│   │   │       │   └── RefreshTokenRepository.java     # Refresh token Redis repository
│   │   │       │
│   │   │       └── security/                            # Security Components
│   │   │           └── JwtAuthenticationFilter.java    # JWT validation filter
│   │   │
│   │   └── resources/
│   │       ├── application.yml                          # Main application config
│   │       ├── application-dev.yml                      # Development config
│   │       ├── application-prod.yml                     # Production config
│   │       └── logback-spring.xml                       # Logging configuration
│   │
│   └── test/
│       ├── java/com/authservice/
│       │   ├── AuthenticationServiceApplicationTests.java  # Context load test
│       │   │
│       │   ├── api/controller/
│       │   │   └── AuthControllerTest.java              # Controller integration tests
│       │   │
│       │   ├── domain/service/
│       │   │   └── JwtServiceTest.java                  # JWT service unit tests
│       │   │
│       │   └── infrastructure/repository/
│       │       └── UserRepositoryTest.java              # Repository integration tests
│       │
│       └── resources/
│           └── application-test.yml                      # Test configuration
│
├── scripts/                                              # Utility Scripts
│   ├── setup-keycloak.sh                                # Keycloak setup script
│   ├── test-api.sh                                      # API testing script
│   └── start-dev.sh                                     # Development startup script
│
├── Dockerfile                                            # Docker image definition
├── docker-compose.yml                                    # Docker Compose config
├── .dockerignore                                         # Docker ignore file
│
├── pom.xml                                              # Maven configuration
├── .gitignore                                           # Git ignore file
├── .env.example                                         # Environment variables template
│
├── README.md                                            # Main documentation
├── ARCHITECTURE.md                                      # Architecture documentation
├── CHANGELOG.md                                         # Version history
├── LICENSE                                              # MIT License
└── PROJECT_STRUCTURE.md                                 # This file
```

## Module Descriptions

### API Layer
Handles HTTP requests and responses. Controllers receive requests, validate input using DTOs, and return appropriate responses.

### Domain Layer
Contains core business logic and domain models. Services implement authentication workflows, token management, and user operations.

### Infrastructure Layer
Manages external integrations, data persistence, and technical concerns. Includes repositories for Redis, security configuration, and filters.

## Key Files

### Configuration Files
- `pom.xml`: Maven dependencies and build configuration
- `application.yml`: Main application configuration
- `application-{profile}.yml`: Environment-specific configurations
- `.env.example`: Environment variables template

### Docker Files
- `Dockerfile`: Multi-stage build for optimized images
- `docker-compose.yml`: Local development stack
- `.dockerignore`: Files excluded from Docker builds

### Documentation
- `README.md`: Setup guide and API documentation
- `ARCHITECTURE.md`: Architecture and design decisions
- `CHANGELOG.md`: Version history and changes
- `PROJECT_STRUCTURE.md`: Project organization

### Scripts
- `setup-keycloak.sh`: Automated Keycloak configuration
- `test-api.sh`: API endpoint testing
- `start-dev.sh`: Development environment startup

## Layer Dependencies

```
API Layer (Controllers, DTOs)
    ↓ depends on
Domain Layer (Services, Models)
    ↓ depends on
Infrastructure Layer (Repositories, Config)
```

Each layer only depends on layers below it, ensuring clean architecture principles.

## Package Naming Convention

- `api.*`: HTTP/REST related code
- `domain.*`: Business logic and entities
- `infrastructure.*`: External integrations and technical concerns

## File Naming Convention

- Controllers: `*Controller.java`
- Services: `*Service.java`
- Repositories: `*Repository.java`
- DTOs: `*Request.java`, `*Response.java`
- Exceptions: `*Exception.java`
- Tests: `*Test.java`

## Total File Count

- Java source files: 28
- Test files: 4
- Configuration files: 8
- Documentation files: 5
- Script files: 3
- Docker files: 3

**Total: 51 files**
