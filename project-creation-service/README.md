# Project Creation Service

A Spring Boot microservice responsible for **validating**, **storing**, and **triggering event processing** for projects. Built following **hexagonal architecture** (ports and adapters).

---

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Docker](#docker)

---

## Architecture

The service follows the **Hexagonal Architecture** (also known as Ports and Adapters):

```
src/main/java/com/example/projectcreation/
├── domain/                         # Core business logic — no framework deps
│   ├── model/                      # Domain entities (Project, ProjectStatus)
│   ├── exception/                  # Domain exceptions
│   └── port/
│       ├── in/                     # Inbound ports (use-case interfaces + commands)
│       └── out/                    # Outbound ports (repository, event publisher)
│
├── application/                    # Use-case implementations
│   └── service/                    # CreateProjectService, GetProjectService
│
├── adapter/
│   └── web/                        # Inbound HTTP adapter
│       ├── controller/             # REST controllers (ProjectController, HealthController)
│       ├── dto/                    # Request / response DTOs
│       └── exception/              # GlobalExceptionHandler (RFC 7807)
│
└── infrastructure/                 # Outbound adapters
    ├── persistence/                # JPA entity, Spring Data repo, persistence adapter
    └── event/                      # Event publishing adapter (logging stub)
```

**Dependency rule:** domain ← application ← adapters/infrastructure. The domain never imports from outer layers.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| Persistence | Spring Data JPA + PostgreSQL |
| Migrations | Flyway |
| Build | Maven |
| Containerisation | Docker (multi-stage) |
| Testing | JUnit 5, Spring Boot Test, MockMvc |

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Docker & Docker Compose (optional, for local DB)
- PostgreSQL 15+ (or use the Docker Compose setup below)

### 1. Clone and configure

```bash
git clone <repo-url>
cd project-creation-service
cp .env.example .env
# Edit .env with your local database credentials
```

### 2. Start PostgreSQL (Docker Compose)

```bash
docker compose up -d postgres
```

A minimal `docker-compose.yml` example:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: project_creation_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: changeme
    ports:
      - "5432:5432"
```

### 3. Run the service

```bash
./mvnw spring-boot:run
```

The service starts on `http://localhost:8080`.

---

## API Reference

### Health Check

```
GET /health
```

**Response 200**
```json
{ "status": "UP" }
```

---

### Create a Project

```
POST /api/v1/projects
Content-Type: application/json
```

**Request body**
```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

**Response 201**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Project",
  "description": "Optional description",
  "status": "PENDING",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### Get a Project

```
GET /api/v1/projects/{id}
```

**Response 200** — project JSON (same shape as above)  
**Response 404** — RFC 7807 problem detail

---

### List All Projects

```
GET /api/v1/projects
```

**Response 200** — JSON array of projects

---

## Configuration

All configuration is driven by environment variables. Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | HTTP port |
| `DB_URL` | `jdbc:postgresql://localhost:5432/project_creation_db` | JDBC URL |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `changeme` | Database password |
| `JPA_DDL_AUTO` | `validate` | Hibernate DDL mode |
| `JPA_SHOW_SQL` | `false` | Log SQL statements |
| `LOG_LEVEL` | `INFO` | Application log level |

---

## Running Tests

```bash
# Unit + integration tests (uses H2 in-memory DB)
./mvnw test

# Skip tests during build
./mvnw package -DskipTests
```

---

## Docker

### Build the image

```bash
docker build -t project-creation-service:latest .
```

### Run the container

```bash
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/project_creation_db \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=changeme \
  project-creation-service:latest
```

---

## Project Status Lifecycle

```
PENDING → ACTIVE → ARCHIVED
```

- **PENDING** — default state on creation
- **ACTIVE** — project has been activated
- **ARCHIVED** — project is no longer active
