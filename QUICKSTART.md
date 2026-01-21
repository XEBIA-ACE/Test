# Quick Start Guide

Get the Authentication Service up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Java 17+ (for local development)
- Maven 3.8+ (for local development)

## Option 1: Docker Compose (Fastest)

### 1. Clone and Configure

```bash
cd authentication-service
cp .env.example .env
```

### 2. Start Everything

```bash
docker-compose up -d
```

This starts:
- Redis (session storage)
- Keycloak (user management)
- Authentication Service

### 3. Configure Keycloak

```bash
chmod +x scripts/setup-keycloak.sh
./scripts/setup-keycloak.sh
```

Copy the client secret from the output and update your `.env` file.

### 4. Test the API

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

### 5. Access the Services

- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Health**: http://localhost:8080/api/v1/health
- **Metrics**: http://localhost:8081/actuator/prometheus
- **Keycloak**: http://localhost:8180 (admin/admin)

## Option 2: Local Development

### 1. Start Dependencies

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### 2. Configure Keycloak

```bash
./scripts/setup-keycloak.sh
```

Update `.env` with the client secret.

### 3. Build and Run

```bash
mvn clean install
mvn spring-boot:run
```

## Quick API Test

### Register a User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecureP@ss123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecureP@ss123"
  }'
```

Save the `accessToken` and `refreshToken` from the response.

### Access Protected Endpoint

```bash
curl -X GET "http://localhost:8080/api/v1/auth/me?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Interactive API Documentation

Open Swagger UI for interactive testing:

http://localhost:8080/swagger-ui.html

## Troubleshooting

### Service won't start

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f auth-service

# Restart services
docker-compose restart
```

### Keycloak connection issues

```bash
# Check Keycloak is ready
curl http://localhost:8180/health/ready

# Verify client secret in .env matches Keycloak
```

### Redis connection issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Should return: PONG
```

## Stop Services

```bash
docker-compose down
```

To remove volumes:

```bash
docker-compose down -v
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand the design
3. Explore the code structure in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
4. Check [CHANGELOG.md](CHANGELOG.md) for version history

## Common Commands

```bash
# Build without Docker
mvn clean package

# Run tests
mvn test

# Build Docker image
docker build -t auth-service:latest .

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# View application logs
docker-compose logs -f auth-service

# Access Redis CLI
docker-compose exec redis redis-cli

# Check health
curl http://localhost:8080/api/v1/health
```

## Environment Variables

Key variables in `.env`:

```env
# Application
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Keycloak
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8180/auth
KEYCLOAK_REALM=authentication-service
KEYCLOAK_CLIENT_SECRET=your-secret-here

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRATION_MS=3600000
```

## Production Deployment

For production deployment:

1. Update `.env` with production values
2. Use secure JWT secret (256-bit minimum)
3. Configure proper Redis password
4. Set up SSL/TLS certificates
5. Use `prod` profile: `SPRING_PROFILES_ACTIVE=prod`
6. Review security settings in `application-prod.yml`

---

**You're all set! Happy coding! 🚀**
