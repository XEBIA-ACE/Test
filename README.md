# Configuration Service

A production-ready Spring Cloud Config Server providing centralized configuration management with Git backend, Consul service discovery, and Vault secrets integration.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Features

- **Centralized Configuration**: Manage application configurations across multiple environments
- **Git Backend**: Version-controlled configuration storage
- **Consul Integration**: Service discovery and health monitoring
- **Vault Support**: Secure secrets management with HashiCorp Vault
- **Multi-Environment**: Support for dev, staging, and production environments
- **Security**: Basic authentication with encrypted credentials
- **Observability**: Prometheus metrics, structured logging, and health checks
- **Encryption**: Support for encrypted property values
- **Docker Support**: Production-ready containerization with multi-stage builds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Config Service                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │   Git     │  │  Consul   │  │   Vault   │               │
│  │ Backend   │  │ Discovery │  │  Secrets  │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│         │              │              │                      │
│         └──────────────┴──────────────┘                      │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │  Config Server    │                          │
│              │  (Spring Cloud)   │                          │
│              └─────────┬─────────┘                          │
│                        │                                     │
│         ┌──────────────┼──────────────┐                     │
│         │              │              │                      │
│    ┌────▼────┐  ┌──────▼──────┐  ┌───▼────┐               │
│    │Security │  │  Actuator   │  │  API   │               │
│    │  Layer  │  │   Metrics   │  │ Layer  │               │
│    └─────────┘  └─────────────┘  └────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Layer Architecture

1. **API Layer** (`controller/`): REST endpoints for configuration and health checks
2. **Service Layer** (`service/`): Business logic for health monitoring and config validation
3. **Configuration Layer** (`config/`): Spring configuration for security, Consul, Vault, and monitoring
4. **Model Layer** (`model/`): Data transfer objects and domain models
5. **Exception Layer** (`exception/`): Global error handling and custom exceptions

## Technology Stack

- **Java**: 17
- **Spring Boot**: 3.2.1
- **Spring Cloud Config**: 2023.0.0
- **Spring Cloud Consul**: Service discovery and configuration
- **Spring Cloud Vault**: Secrets management
- **Spring Security**: Authentication and authorization
- **Micrometer**: Metrics and observability
- **Logback**: Structured logging with JSON support
- **Maven**: Build and dependency management
- **Docker**: Containerization
- **JUnit 5 & Mockito**: Testing framework

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Docker and Docker Compose (for containerized deployment)
- Git repository for storing configurations
- (Optional) Consul instance
- (Optional) Vault instance

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd config-service
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Verify the service is running**:
   ```bash
   curl -u admin:admin123 http://localhost:8888/actuator/health
   ```

### Local Development

1. **Build the project**:
   ```bash
   mvn clean package
   ```

2. **Run the application**:
   ```bash
   java -jar target/config-service-1.0.0.jar
   ```

3. **Or use Maven Spring Boot plugin**:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SPRING_PROFILES_ACTIVE` | Active profile (dev/staging/prod) | dev | No |
| `GIT_REPO_URI` | Git repository URL | - | Yes |
| `GIT_USERNAME` | Git username | - | No |
| `GIT_PASSWORD` | Git password/token | - | No |
| `CONSUL_ENABLED` | Enable Consul integration | true | No |
| `CONSUL_HOST` | Consul server host | localhost | No |
| `CONSUL_PORT` | Consul server port | 8500 | No |
| `VAULT_ENABLED` | Enable Vault integration | false | No |
| `VAULT_HOST` | Vault server host | localhost | No |
| `VAULT_PORT` | Vault server port | 8200 | No |
| `VAULT_TOKEN` | Vault authentication token | - | If Vault enabled |
| `CONFIG_USERNAME` | Config server username | admin | No |
| `CONFIG_PASSWORD` | Config server password | changeme | No |
| `SERVER_PORT` | Server port | 8888 | No |

### Git Repository Structure

Your configuration Git repository should follow this structure:

```
config-repo/
├── application.yml              # Default config for all applications
├── application-dev.yml          # Dev environment defaults
├── application-staging.yml      # Staging environment defaults
├── application-prod.yml         # Production environment defaults
├── myapp/
│   ├── application.yml          # Config for 'myapp'
│   ├── application-dev.yml      # Dev config for 'myapp'
│   └── application-prod.yml     # Prod config for 'myapp'
└── another-app/
    └── application.yml
```

### Profiles

- **dev**: Local development with minimal external dependencies
- **staging**: Staging environment with Consul and Vault
- **prod**: Production environment with full security and monitoring

## API Documentation

### Configuration Endpoints

#### Get Configuration
```http
GET /{application}/{profile}[/{label}]
Authorization: Basic <credentials>
```

**Example**:
```bash
curl -u admin:changeme http://localhost:8888/myapp/prod
```

**Response**:
```json
{
  "name": "myapp",
  "profiles": ["prod"],
  "label": "main",
  "version": "abc123",
  "propertySources": [
    {
      "name": "https://github.com/your-org/config-repo.git/myapp/application-prod.yml",
      "source": {
        "key": "value"
      }
    }
  ]
}
```

### Health Check Endpoints

#### Application Health
```http
GET /actuator/health
```

**Response**:
```json
{
  "status": "UP",
  "components": {
    "diskSpace": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

#### Config Sources Health
```http
GET /api/v1/config/health
Authorization: Basic <credentials>
```

**Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00Z",
  "components": {
    "git": "UP",
    "consul": "UP",
    "vault": "UP"
  },
  "gitUri": "https://github.com/your-org/config-repo.git",
  "consulHost": "localhost",
  "vaultHost": "localhost"
}
```

### Monitoring Endpoints

#### Metrics (Prometheus format)
```http
GET /actuator/prometheus
Authorization: Basic <credentials>
```

#### Info
```http
GET /actuator/info
```

### Encryption Endpoints

#### Encrypt a value
```http
POST /encrypt
Authorization: Basic <credentials>
Content-Type: text/plain

mysecretvalue
```

#### Decrypt a value
```http
POST /decrypt
Authorization: Basic <credentials>
Content-Type: text/plain

{cipher}encryptedvalue
```

## Running Tests

### Run all tests
```bash
mvn test
```

### Run specific test class
```bash
mvn test -Dtest=ConfigHealthServiceTest
```

### Run integration tests only
```bash
mvn test -Dtest=*IntegrationTest
```

### Run tests with coverage
```bash
mvn test jacoco:report
```

### Test Structure

```
src/test/
├── java/com/example/configservice/
│   ├── ConfigServiceApplicationTests.java  # Context loading test
│   ├── integration/                        # Integration tests
│   │   ├── ActuatorEndpointsIntegrationTest.java
│   │   ├── ConfigHealthControllerIntegrationTest.java
│   │   └── ConfigServerIntegrationTest.java
│   └── unit/                               # Unit tests
│       └── ConfigHealthServiceTest.java
└── resources/
    └── application-test.yml                # Test configuration
```

## Deployment

### Docker Build

```bash
# Build the Docker image
docker build -t config-service:1.0.0 .

# Run the container
docker run -d \
  -p 8888:8888 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e GIT_REPO_URI=https://github.com/your-org/config-repo.git \
  -e GIT_USERNAME=your-username \
  -e GIT_PASSWORD=your-token \
  --name config-service \
  config-service:1.0.0
```

### Kubernetes Deployment

Example Kubernetes deployment configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: config-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: config-service
  template:
    metadata:
      labels:
        app: config-service
    spec:
      containers:
      - name: config-service
        image: config-service:1.0.0
        ports:
        - containerPort: 8888
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: GIT_REPO_URI
          valueFrom:
            secretKeyRef:
              name: config-secrets
              key: git-repo-uri
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8888
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8888
          initialDelaySeconds: 30
          periodSeconds: 5
```

## Security

### Authentication

The service uses HTTP Basic Authentication. All endpoints except health checks require authentication.

**Default credentials** (change in production):
- Username: `admin`
- Password: `changeme`

### Configuration Encryption

Encrypt sensitive configuration values:

```bash
# Encrypt a value
curl -u admin:changeme -X POST http://localhost:8888/encrypt \
  -d "mysecretpassword"

# Use encrypted value in config
password: '{cipher}AQA...'
```

### Best Practices

1. **Change default credentials** before deploying to production
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** in production environments
4. **Rotate credentials** regularly
5. **Use Vault** for storing secrets in production
6. **Implement network policies** to restrict access
7. **Enable audit logging** for compliance

## Monitoring

### Prometheus Metrics

The service exposes Prometheus metrics at `/actuator/prometheus`. Configure Prometheus to scrape this endpoint:

```yaml
scrape_configs:
  - job_name: 'config-service'
    static_configs:
      - targets: ['localhost:8888']
    metrics_path: '/actuator/prometheus'
    basic_auth:
      username: 'admin'
      password: 'changeme'
```

### Key Metrics

- `config.health.check` - Configuration health check duration
- `http.server.requests` - HTTP request metrics
- `jvm.memory.used` - JVM memory usage
- `system.cpu.usage` - CPU utilization

### Logging

Structured JSON logging is enabled for staging and production environments. Logs are written to:

- **Console**: Colored output for development
- **File**: `/var/log/config-service/application.log` (production)

Log levels:
- **Development**: DEBUG for application, INFO for Spring
- **Production**: INFO for application, WARN for root

## Troubleshooting

### Common Issues

#### Service won't start

**Problem**: Application fails to start with Git connectivity error

**Solution**:
```bash
# Verify Git repository is accessible
git ls-remote https://github.com/your-org/config-repo.git

# Check Git credentials
echo $GIT_USERNAME
echo $GIT_PASSWORD

# Test with public repository first
export GIT_REPO_URI=https://github.com/spring-cloud-samples/config-repo
```

#### Consul connection refused

**Problem**: Service cannot connect to Consul

**Solution**:
```bash
# Disable Consul for testing
export CONSUL_ENABLED=false

# Or verify Consul is running
curl http://localhost:8500/v1/status/leader
```

#### Authentication failures

**Problem**: 401 Unauthorized when accessing config

**Solution**:
```bash
# Verify credentials
curl -u admin:changeme http://localhost:8888/actuator/health

# Check logs for authentication errors
docker logs config-service | grep -i auth
```

### Health Check

```bash
# Quick health check
curl http://localhost:8888/actuator/health

# Detailed health with auth
curl -u admin:changeme http://localhost:8888/actuator/health

# Check all components
curl -u admin:changeme http://localhost:8888/api/v1/config/health
```

### Debug Logging

Enable debug logging:
```bash
export LOGGING_LEVEL_COM_EXAMPLE_CONFIGSERVICE=DEBUG
export LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_CLOUD_CONFIG=DEBUG
```

## Development

### Project Structure

```
config-service/
├── src/
│   ├── main/
│   │   ├── java/com/example/configservice/
│   │   │   ├── ConfigServiceApplication.java    # Main application
│   │   │   ├── config/                          # Configuration classes
│   │   │   │   ├── ActuatorConfig.java
│   │   │   │   ├── ConsulConfig.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── VaultConfig.java
│   │   │   ├── controller/                      # REST controllers
│   │   │   │   └── ConfigHealthController.java
│   │   │   ├── service/                         # Business logic
│   │   │   │   └── ConfigHealthService.java
│   │   │   ├── model/                           # Data models
│   │   │   │   └── ConfigHealthResponse.java
│   │   │   ├── exception/                       # Exception handling
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   └── security/                        # Security components
│   │   └── resources/
│   │       ├── application.yml                  # Main config
│   │       ├── application-dev.yml              # Dev config
│   │       ├── application-staging.yml          # Staging config
│   │       ├── application-prod.yml             # Production config
│   │       ├── bootstrap.yml                    # Bootstrap config
│   │       └── logback-spring.xml               # Logging config
│   └── test/
│       ├── java/com/example/configservice/
│       │   ├── integration/                     # Integration tests
│       │   └── unit/                            # Unit tests
│       └── resources/
│           └── application-test.yml             # Test config
├── Dockerfile                                   # Docker build config
├── docker-compose.yml                           # Local environment
├── pom.xml                                      # Maven dependencies
├── .env.example                                 # Environment variables template
├── .gitignore                                   # Git ignore rules
└── README.md                                    # This file
```

### Adding New Features

1. Follow Clean Architecture principles
2. Add tests for new functionality
3. Update documentation
4. Follow existing code style
5. Use dependency injection
6. Add appropriate logging
7. Handle errors gracefully

## License

Copyright © 2024. All rights reserved.

## Support

For issues and questions:
- Create an issue in the repository
- Contact: devops@example.com
