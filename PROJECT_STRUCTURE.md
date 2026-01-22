# Configuration Service - Project Structure

## Directory Layout

```
config-service/
├── src/
│   ├── main/
│   │   ├── java/com/example/configservice/
│   │   │   ├── ConfigServiceApplication.java       # Main Spring Boot application
│   │   │   ├── config/                             # Configuration classes
│   │   │   │   ├── ActuatorConfig.java            # Metrics and monitoring setup
│   │   │   │   ├── ConsulConfig.java              # Consul service discovery
│   │   │   │   ├── SecurityConfig.java            # Security & authentication
│   │   │   │   └── VaultConfig.java               # Vault secrets integration
│   │   │   ├── controller/                         # REST API controllers
│   │   │   │   └── ConfigHealthController.java    # Health check endpoints
│   │   │   ├── service/                            # Business logic layer
│   │   │   │   └── ConfigHealthService.java       # Health monitoring service
│   │   │   ├── model/                              # Domain models & DTOs
│   │   │   │   └── ConfigHealthResponse.java      # Health response model
│   │   │   ├── exception/                          # Exception handling
│   │   │   │   └── GlobalExceptionHandler.java    # Global error handler
│   │   │   └── security/                           # Security components
│   │   └── resources/
│   │       ├── application.yml                     # Main configuration
│   │       ├── application-dev.yml                 # Development config
│   │       ├── application-staging.yml             # Staging config
│   │       ├── application-prod.yml                # Production config
│   │       ├── bootstrap.yml                       # Bootstrap config
│   │       └── logback-spring.xml                  # Logging configuration
│   └── test/
│       ├── java/com/example/configservice/
│       │   ├── ConfigServiceApplicationTests.java  # Context loading test
│       │   ├── integration/                        # Integration tests
│       │   │   ├── ActuatorEndpointsIntegrationTest.java
│       │   │   ├── ConfigHealthControllerIntegrationTest.java
│       │   │   └── ConfigServerIntegrationTest.java
│       │   └── unit/                               # Unit tests
│       │       └── ConfigHealthServiceTest.java
│       └── resources/
│           └── application-test.yml                # Test configuration
├── scripts/                                        # Utility scripts
│   ├── build.sh                                    # Build script
│   ├── run-dev.sh                                  # Development run script
│   ├── docker-build.sh                             # Docker build script
│   └── health-check.sh                             # Health check script
├── config-repo-example/                            # Example config repository
│   ├── README.md                                   # Config repo documentation
│   ├── application.yml                             # Global defaults
│   ├── application-dev.yml                         # Global dev config
│   ├── application-prod.yml                        # Global prod config
│   └── myapp/                                      # App-specific configs
│       ├── application.yml
│       ├── application-dev.yml
│       └── application-prod.yml
├── Dockerfile                                      # Multi-stage Docker build
├── .dockerignore                                   # Docker ignore rules
├── docker-compose.yml                              # Local environment setup
├── docker-compose.override.yml                     # Development overrides
├── pom.xml                                         # Maven dependencies
├── .gitignore                                      # Git ignore rules
├── .env.example                                    # Environment variables template
├── README.md                                       # Main documentation
├── QUICKSTART.md                                   # Quick start guide
├── API.md                                          # API documentation
├── CONTRIBUTING.md                                 # Contribution guidelines
└── PROJECT_STRUCTURE.md                            # This file

```

## Component Overview

### Core Application (src/main/java/)

#### Main Application
- **ConfigServiceApplication.java**: Entry point with `@EnableConfigServer`

#### Configuration Layer (config/)
- **ActuatorConfig.java**: Configures Micrometer metrics and monitoring
- **ConsulConfig.java**: Service discovery and registration with Consul
- **SecurityConfig.java**: HTTP Basic auth, user management, security filters
- **VaultConfig.java**: HashiCorp Vault integration for secrets

#### API Layer (controller/)
- **ConfigHealthController.java**: Custom health check endpoint for config sources

#### Service Layer (service/)
- **ConfigHealthService.java**: Business logic for monitoring Git, Consul, Vault

#### Model Layer (model/)
- **ConfigHealthResponse.java**: DTO for health check responses

#### Exception Handling (exception/)
- **GlobalExceptionHandler.java**: Centralized error handling for all endpoints

### Configuration (src/main/resources/)

- **application.yml**: Base configuration with environment variable placeholders
- **application-dev.yml**: Development profile (local, minimal dependencies)
- **application-staging.yml**: Staging profile (with Consul & Vault)
- **application-prod.yml**: Production profile (secured, monitored)
- **bootstrap.yml**: Bootstrap configuration loaded before main config
- **logback-spring.xml**: Structured logging with JSON format

### Testing (src/test/java/)

#### Integration Tests
- **ActuatorEndpointsIntegrationTest**: Tests health and metrics endpoints
- **ConfigHealthControllerIntegrationTest**: Tests custom health API
- **ConfigServerIntegrationTest**: Tests config retrieval from Git

#### Unit Tests
- **ConfigHealthServiceTest**: Tests health check logic

### Docker & Deployment

- **Dockerfile**: Multi-stage build (builder + runtime)
- **docker-compose.yml**: Full stack (Config Server, Consul, Vault, Gitea)
- **docker-compose.override.yml**: Development overrides

### Utility Scripts (scripts/)

- **build.sh**: Complete build pipeline
- **run-dev.sh**: Start in development mode
- **docker-build.sh**: Build Docker image
- **health-check.sh**: Verify service health

### Documentation

- **README.md**: Complete documentation (setup, config, deployment)
- **QUICKSTART.md**: Get started in 5 minutes
- **API.md**: Full API reference with examples
- **CONTRIBUTING.md**: Development guidelines
- **PROJECT_STRUCTURE.md**: This file

### Configuration Repository Example

The `config-repo-example/` directory shows how to structure your Git configuration repository:

```
config-repo/
├── application.yml              # Shared defaults
├── application-{profile}.yml    # Environment-specific defaults
└── {application}/               # Per-application configs
    ├── application.yml
    └── application-{profile}.yml
```

## Technology Stack

### Core Framework
- **Spring Boot 3.2.1**: Application framework
- **Spring Cloud Config 2023.0.0**: Configuration server
- **Java 17**: Programming language

### Service Discovery & Secrets
- **Spring Cloud Consul**: Service discovery and health checks
- **Spring Cloud Vault**: Secrets management

### Security
- **Spring Security**: Authentication and authorization
- **BCrypt**: Password encryption

### Observability
- **Spring Boot Actuator**: Health checks and metrics
- **Micrometer**: Metrics collection
- **Prometheus**: Metrics format
- **Logback**: Structured logging
- **Logstash Encoder**: JSON log formatting

### Build & Testing
- **Maven 3.9.6**: Build tool
- **JUnit 5**: Testing framework
- **Mockito**: Mocking framework
- **AssertJ**: Fluent assertions
- **Testcontainers**: Integration testing with containers

### Containerization
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Architecture Principles

### Clean Architecture
- **Separation of Concerns**: Clear layer separation
- **Dependency Injection**: Loose coupling via Spring DI
- **SOLID Principles**: Applied throughout the codebase

### Layers
1. **API Layer**: REST controllers, request/response handling
2. **Service Layer**: Business logic, health checks
3. **Configuration Layer**: Spring beans, integrations
4. **Model Layer**: Data structures, DTOs

### Security
- HTTP Basic Authentication on all endpoints (except public health)
- Password encryption with BCrypt
- Environment-based credential management
- Support for encrypted configuration values

### Observability
- Structured JSON logging
- Prometheus metrics
- Health checks (liveness/readiness)
- Request/response logging

### Multi-Environment Support
- Profile-based configuration (dev, staging, prod)
- Environment variable injection
- Secrets management via Vault

## Build & Deploy Workflow

### Development
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Testing
```bash
mvn test                    # Run all tests
mvn verify                  # Run integration tests
```

### Build
```bash
mvn clean package          # Create JAR
```

### Docker
```bash
docker build -t config-service:1.0.0 .
docker-compose up -d
```

### Production
- Build optimized Docker image
- Deploy to Kubernetes/Cloud
- Configure Consul for service discovery
- Configure Vault for secrets
- Enable HTTPS/TLS
- Set up monitoring (Prometheus + Grafana)

## Key Features

1. **Centralized Configuration**: Single source of truth for all app configs
2. **Version Control**: Git-backed configuration history
3. **Multi-Environment**: Support for dev, staging, production
4. **Service Discovery**: Automatic registration with Consul
5. **Secrets Management**: Vault integration for sensitive data
6. **Security**: Authentication and encrypted values
7. **Monitoring**: Metrics, logging, and health checks
8. **Docker Support**: Production-ready containerization
9. **Testing**: Comprehensive unit and integration tests
10. **Documentation**: Complete API and setup guides

## Extension Points

To extend the service:

1. **Add Custom Endpoints**: Create new controllers in `controller/`
2. **Add Business Logic**: Create services in `service/`
3. **Custom Configuration**: Add classes in `config/`
4. **New Integrations**: Implement in respective config classes
5. **Custom Metrics**: Add `@Timed` annotations or custom meters
6. **Additional Profiles**: Create `application-{profile}.yml` files

## Dependencies Summary

### Spring Cloud
- spring-cloud-config-server
- spring-cloud-starter-consul-discovery
- spring-cloud-starter-consul-config
- spring-cloud-starter-vault-config

### Spring Boot
- spring-boot-starter-actuator
- spring-boot-starter-security
- spring-boot-starter-validation

### Observability
- micrometer-registry-prometheus
- logstash-logback-encoder

### Testing
- spring-boot-starter-test
- spring-security-test
- testcontainers

See `pom.xml` for complete dependency list with versions.
