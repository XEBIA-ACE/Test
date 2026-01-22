# Configuration Service API Reference

## Base URL

```
http://localhost:8888
```

## Authentication

All endpoints except public health checks require HTTP Basic Authentication.

```
Username: admin
Password: changeme (default - change in production)
```

## Endpoints

### Configuration Management

#### Retrieve Configuration

Fetch configuration for a specific application and profile.

**Endpoint**: `GET /{application}/{profile}[/{label}]`

**Parameters**:
- `application` (path) - Application name
- `profile` (path) - Environment profile (dev, staging, prod)
- `label` (path, optional) - Git branch/tag/commit (default: main)

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/myapp/prod
```

**Example Response**:
```json
{
  "name": "myapp",
  "profiles": ["prod"],
  "label": "main",
  "version": "a1b2c3d4",
  "state": null,
  "propertySources": [
    {
      "name": "https://github.com/your-org/config-repo.git/myapp/application-prod.yml",
      "source": {
        "database.url": "jdbc:postgresql://prod-db:5432/myapp",
        "database.username": "app_user",
        "feature.flag.newUI": true
      }
    }
  ]
}
```

#### Retrieve Configuration with Label

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/myapp/prod/release-1.0
```

### Encryption/Decryption

#### Encrypt Value

Encrypt a plain text value.

**Endpoint**: `POST /encrypt`

**Request**:
```bash
curl -u admin:changeme \
  -X POST \
  -H "Content-Type: text/plain" \
  -d "mysecretpassword" \
  http://localhost:8888/encrypt
```

**Response**:
```
AQA1lL5E3cP8B9mN7kJ2hG4fD1sA6qW8eR3tY5uI0oP...
```

**Usage in Configuration**:
```yaml
database:
  password: '{cipher}AQA1lL5E3cP8B9mN7kJ2hG4fD1sA6qW8eR3tY5uI0oP...'
```

#### Decrypt Value

Decrypt an encrypted value.

**Endpoint**: `POST /decrypt`

**Request**:
```bash
curl -u admin:changeme \
  -X POST \
  -H "Content-Type: text/plain" \
  -d "AQA1lL5E3cP8B9mN7kJ2hG4fD1sA6qW8eR3tY5uI0oP..." \
  http://localhost:8888/decrypt
```

**Response**:
```
mysecretpassword
```

### Health Checks

#### Application Health

**Endpoint**: `GET /actuator/health`

**Authentication**: None (public)

**Example Request**:
```bash
curl http://localhost:8888/actuator/health
```

**Example Response**:
```json
{
  "status": "UP",
  "components": {
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 500000000000,
        "free": 250000000000,
        "threshold": 10485760,
        "exists": true
      }
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

#### Configuration Sources Health

**Endpoint**: `GET /api/v1/config/health`

**Authentication**: Required

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/api/v1/config/health
```

**Example Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "components": {
    "git": "UP",
    "consul": "UP",
    "vault": "UP"
  },
  "gitUri": "https://github.com/your-org/config-repo.git",
  "consulHost": "consul.example.com",
  "vaultHost": "vault.example.com"
}
```

### Monitoring

#### Application Info

**Endpoint**: `GET /actuator/info`

**Authentication**: None (public)

**Example Request**:
```bash
curl http://localhost:8888/actuator/info
```

**Example Response**:
```json
{
  "app": {
    "name": "config-service",
    "version": "1.0.0"
  }
}
```

#### Prometheus Metrics

**Endpoint**: `GET /actuator/prometheus`

**Authentication**: Required

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/actuator/prometheus
```

**Example Response**:
```
# HELP jvm_memory_used_bytes The amount of used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",id="PS Eden Space",} 1.23456789E8
# HELP config_health_check_seconds Time taken to check config health
# TYPE config_health_check_seconds summary
config_health_check_seconds_count{application="config-service",} 15.0
config_health_check_seconds_sum{application="config-service",} 0.45
```

#### All Metrics (JSON)

**Endpoint**: `GET /actuator/metrics`

**Authentication**: Required

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/actuator/metrics
```

#### Specific Metric

**Endpoint**: `GET /actuator/metrics/{metric.name}`

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/actuator/metrics/jvm.memory.used
```

### Environment

#### View Environment Properties

**Endpoint**: `GET /actuator/env`

**Authentication**: Required

**Example Request**:
```bash
curl -u admin:changeme \
  http://localhost:8888/actuator/env
```

## Error Responses

### 401 Unauthorized

**Response**:
```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/myapp/prod"
}
```

### 403 Forbidden

**Response**:
```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "status": 403,
  "error": "Access Denied",
  "message": "You don't have permission to access this resource",
  "path": "/actuator/prometheus"
}
```

### 404 Not Found

**Response**:
```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Config not found for application: nonexistent, profile: prod",
  "path": "/nonexistent/prod"
}
```

### 500 Internal Server Error

**Response**:
```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/myapp/prod"
}
```

## Usage Examples

### Java Spring Boot Client

```java
# bootstrap.yml
spring:
  application:
    name: myapp
  cloud:
    config:
      uri: http://localhost:8888
      username: admin
      password: changeme
      fail-fast: true
      retry:
        max-attempts: 3
  profiles:
    active: prod
```

### Node.js Client

```javascript
const axios = require('axios');

async function getConfig() {
  const response = await axios.get(
    'http://localhost:8888/myapp/prod',
    {
      auth: {
        username: 'admin',
        password: 'changeme'
      }
    }
  );

  return response.data;
}
```

### Python Client

```python
import requests

def get_config(app, profile):
    url = f'http://localhost:8888/{app}/{profile}'
    auth = ('admin', 'changeme')

    response = requests.get(url, auth=auth)
    response.raise_for_status()

    return response.json()
```

### cURL Examples

```bash
# Get development config
curl -u admin:changeme http://localhost:8888/myapp/dev

# Get production config from specific branch
curl -u admin:changeme http://localhost:8888/myapp/prod/release-1.0

# Encrypt a password
curl -u admin:changeme -X POST \
  -H "Content-Type: text/plain" \
  -d "mypassword" \
  http://localhost:8888/encrypt

# Check health
curl http://localhost:8888/actuator/health

# Get metrics
curl -u admin:changeme http://localhost:8888/actuator/prometheus
```

## Rate Limiting

Currently, no rate limiting is enforced. Consider implementing rate limiting in production using:
- API Gateway (e.g., Kong, Ambassador)
- Spring Cloud Gateway with rate limiting filter
- Reverse proxy (e.g., Nginx) with rate limiting

## Versioning

API versioning is implemented through URL paths:
- Current version: `/api/v1/*`
- Future versions will use `/api/v2/*`, etc.

Configuration endpoints (`/{application}/{profile}`) follow Spring Cloud Config conventions and do not include version prefixes.
