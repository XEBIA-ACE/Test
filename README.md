# Authentication Service

A production-ready OAuth 2.0 authentication service built with Spring Boot, featuring JWT token management, Keycloak integration, and Redis-based session storage.

## Features

- **OAuth 2.0 Authentication**: Industry-standard authentication protocol
- **JWT Token Management**: Secure access and refresh token generation
- **Keycloak Integration**: Enterprise-grade identity and access management
- **Redis Session Storage**: High-performance session management and caching
- **Spring Security**: Comprehensive security configuration
- **RESTful API**: Clean, documented API endpoints
- **OpenAPI/Swagger**: Interactive API documentation
- **Health Checks & Metrics**: Production-ready observability with Actuator and Prometheus
- **Docker Support**: Containerized deployment with Docker Compose
- **Multi-Environment**: Separate configurations for dev, staging, and production

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Security**
- **OAuth 2.0 & JWT**
- **Keycloak 23.0.3**
- **Redis 7.2**
- **Maven**
- **Docker & Docker Compose**

## Architecture

The application follows Clean Architecture principles with clear separation of concerns:

```
src/main/java/com/authservice/
├── api/                          # API Layer
│   ├── controller/               # REST controllers
│   ├── dto/                      # Data Transfer Objects
│   └── exception/                # Exception handlers
├── domain/                       # Domain Layer
│   ├── model/                    # Domain entities
│   ├── service/                  # Business logic
│   └── exception/                # Domain exceptions
└── infrastructure/               # Infrastructure Layer
    ├── config/                   # Configuration classes
    ├── repository/               # Data access
    └── security/                 # Security filters
```

### Layer Responsibilities

- **API Layer**: Handles HTTP requests, validation, and response formatting
- **Domain Layer**: Contains business logic and domain models
- **Infrastructure Layer**: Manages external integrations, persistence, and security

## Prerequisites

- Java 17 or higher
- Maven 3.8+
- Docker and Docker Compose (for containerized deployment)
- Redis 7.2+ (if running locally)
- Keycloak 23.0+ (if running locally)

## Getting Started

### Option 1: Docker Compose (Recommended)

The easiest way to run the entire stack:

```bash
# Clone the repository
git clone <repository-url>
cd authentication-service

# Copy environment file and configure
cp .env.example .env

# Start all services (Redis, Keycloak, Auth Service)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f auth-service
```

The services will be available at:
- **Authentication Service**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Actuator**: http://localhost:8081/actuator
- **Keycloak Admin**: http://localhost:8180 (admin/admin)
- **Redis**: localhost:6379

### Option 2: Local Development

Run the application locally with external dependencies:

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:7.2-alpine

# 2. Start Keycloak
docker run -d -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:23.0 start-dev

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Build and run the application
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Keycloak Setup

Before using the authentication service, configure Keycloak:

1. Access Keycloak Admin Console: http://localhost:8180
2. Login with admin/admin
3. Create a new realm: `authentication-service`
4. Create a new client:
   - Client ID: `auth-service-client`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:8080/*`
   - Web Origins: `*`
5. Get the client secret from the Credentials tab
6. Update `KEYCLOAK_CLIENT_SECRET` in `.env` or `application.yml`

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for all options):

```env
# Application
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Keycloak
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8180/auth
KEYCLOAK_REALM=authentication-service
KEYCLOAK_RESOURCE=auth-service-client
KEYCLOAK_CLIENT_SECRET=your-client-secret-here

# JWT
JWT_SECRET=your-256-bit-secret-key-change-this-in-production
JWT_EXPIRATION_MS=3600000
JWT_REFRESH_EXPIRATION_MS=86400000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
```

### Profiles

The application supports multiple profiles:

- **dev**: Development environment with debug logging
- **prod**: Production environment with optimized settings

Activate a profile:
```bash
# Via Maven
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# Via JAR
java -jar -Dspring.profiles.active=prod target/authentication-service-1.0.0.jar

# Via environment variable
export SPRING_PROFILES_ACTIVE=prod
```

## API Documentation

### Swagger UI

Interactive API documentation is available at:
- http://localhost:8080/swagger-ui.html

### API Endpoints

#### Authentication Endpoints

**Register User**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "password": "SecureP@ssw0rd",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "john.doe",
  "password": "SecureP@ssw0rd"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["USER"],
    "enabled": true
  }
}
```

**Refresh Token**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Logout**
```http
POST /api/v1/auth/logout?sessionId=<session-id>
Authorization: Bearer <access-token>
```

**Get Current User**
```http
GET /api/v1/auth/me?userId=<user-id>
Authorization: Bearer <access-token>
```

#### Health Check

```http
GET /api/v1/health
```

Response:
```json
{
  "status": "UP",
  "timestamp": "2025-01-21T10:15:30",
  "service": "authentication-service",
  "version": "1.0.0",
  "dependencies": {
    "redis": "UP"
  }
}
```

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Observability

### Health Checks

Health check endpoint with dependency status:
```bash
curl http://localhost:8080/api/v1/health
```

Spring Boot Actuator health endpoint:
```bash
curl http://localhost:8081/actuator/health
```

### Metrics

Prometheus metrics endpoint:
```bash
curl http://localhost:8081/actuator/prometheus
```

Available metrics include:
- JVM metrics (memory, threads, GC)
- HTTP request metrics
- Custom application metrics

### Logging

Structured logging with different levels per environment:
- **Development**: DEBUG level for application code
- **Production**: INFO level with log rotation

Log configuration in `src/main/resources/logback-spring.xml`

## Security

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### JWT Token Security

- Tokens are signed with HMAC-SHA256
- Access tokens expire in 1 hour (configurable)
- Refresh tokens expire in 24 hours (configurable)
- Tokens include user ID, roles, and other claims

### Session Management

- Sessions stored in Redis with TTL
- Session timeout: 30 minutes (configurable)
- Support for multiple concurrent sessions per user

### CORS Configuration

Configure allowed origins, methods, and headers in `application.yml` or environment variables.

## Testing

### Run Tests

```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report

# Run specific test class
mvn test -Dtest=AuthenticationServiceTest
```

### Test Structure

```
src/test/java/com/authservice/
├── api/
│   └── controller/              # Controller tests
├── domain/
│   └── service/                 # Service tests
└── infrastructure/
    └── repository/              # Repository tests
```

## Building for Production

### Build JAR

```bash
mvn clean package -DskipTests
```

The JAR file will be created at: `target/authentication-service-1.0.0.jar`

### Build Docker Image

```bash
docker build -t authentication-service:1.0.0 .
```

### Run Production Build

```bash
java -jar -Dspring.profiles.active=prod target/authentication-service-1.0.0.jar
```

## Deployment

### Docker Compose (Production)

Update `docker-compose.yml` for production:
- Use environment-specific `.env` file
- Configure proper secrets management
- Set up persistent volumes
- Configure resource limits

### Kubernetes

Sample Kubernetes manifests (create these files as needed):

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: authentication-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: authentication-service
  template:
    metadata:
      labels:
        app: authentication-service
    spec:
      containers:
      - name: authentication-service
        image: authentication-service:1.0.0
        ports:
        - containerPort: 8080
        - containerPort: 8081
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        # Add other environment variables
```

## Troubleshooting

### Common Issues

**1. Keycloak Connection Failed**
- Ensure Keycloak is running and accessible
- Verify `KEYCLOAK_AUTH_SERVER_URL` is correct
- Check client secret matches Keycloak configuration

**2. Redis Connection Failed**
- Verify Redis is running: `docker ps | grep redis`
- Check Redis connection settings in configuration
- Test Redis: `redis-cli ping`

**3. JWT Validation Errors**
- Ensure JWT secret is configured and consistent
- Check token expiration time
- Verify token format (Bearer prefix)

### Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f auth-service

# Local
tail -f spring.log
```

## Development

### Code Style

- Follow Java conventions
- Use Lombok for boilerplate code
- Write meaningful comments for complex logic
- Maintain test coverage above 80%

### Adding New Features

1. Create domain models in `domain/model`
2. Implement business logic in `domain/service`
3. Create DTOs in `api/dto`
4. Add controllers in `api/controller`
5. Write tests for all layers
6. Update API documentation

## Performance

- Redis caching for sessions reduces database load
- JWT tokens minimize server-side state
- Stateless API design enables horizontal scaling
- Connection pooling for Redis and HTTP clients

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@authservice.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Built with ❤️ using Spring Boot**
