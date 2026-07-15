# ProjectManagementService

A Spring Boot REST API service that manages the full lifecycle of projects.  
It follows **hexagonal architecture** (ports & adapters) and integrates with external Calendar and Reporting services.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker](#docker)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)

---

## Overview

**ProjectManagementService** is responsible for:

- Managing project lifecycle operations (create, update, activate, complete, archive, delete)
- Coordinating with an external **Calendar** service to schedule project timelines
- Notifying an external **Reporting** service of project state changes
- Ensuring all project data is validated and stored securely in PostgreSQL
- Providing a device-responsive dashboard for current resource allocation and capacity

---

## Architecture

The service is structured around **Hexagonal Architecture** (also known as Ports & Adapters):

```
┌──────────────────────────────────────────────────────────────┐
│                        Web Adapter (REST)                     │
│  ProjectController  HealthController  GlobalExceptionHandler  │
└────────────────────────────┬─────────────────────────────────┘
                             │  drives via Input Port
┌────────────────────────────▼─────────────────────────────────┐
│                     Application Layer                         │
│                      ProjectService                           │
└──────┬─────────────────────────────────────────┬─────────────┘
       │ uses Output Ports                        │
┌──────▼──────────┐  ┌──────────────┐  ┌─────────▼────────────┐
│  ProjectRepo    │  │ CalendarPort │  │  ReportingPort        │
│  (JPA Adapter)  │  │ (HTTP Stub)  │  │  (HTTP Stub)          │
└─────────────────┘  └──────────────┘  └──────────────────────┘
       │
┌──────▼──────────┐
│   PostgreSQL    │
└─────────────────┘
```

**Layers:**

| Layer | Package | Responsibility |
|---|---|---|
| Domain | `domain.model`, `domain.port`, `domain.exception` | Business entities, port interfaces, domain rules |
| Application | `application.service` | Orchestrates use cases, calls output ports |
| Infrastructure | `infrastructure.persistence`, `infrastructure.external` | JPA adapters, external HTTP stubs |
| Web | `web.controller`, `web.dto`, `web.exception` | REST controllers, DTOs, error handling |

---

## Technology Stack

| Component | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Persistence | Spring Data JPA + PostgreSQL |
| Migrations | Flyway |
| Build | Maven |
| Container | Docker (multi-stage, Eclipse Temurin 21) |

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Docker & Docker Compose (optional, for containerised setup)
- PostgreSQL 15+ (or use the Docker Compose stack)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd project-management-service
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

3. **Start PostgreSQL** (if not already running)

   ```bash
   docker run -d \
     --name pg-projectmgmt \
     -e POSTGRES_DB=projectmanagement \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=changeme \
     -p 5432:5432 \
     postgres:15-alpine
   ```

4. **Run the application**

   ```bash
   ./mvnw spring-boot:run
   ```

   The service starts on `http://localhost:8080`.

5. **Run the dashboard during frontend development**

   ```bash
   cd dashboard-ui
   npm ci
   npm run dev
   ```

   Vite serves the responsive dashboard on port `5173` and proxies API requests
   to the Spring Boot service. The production Docker image builds and serves the
   dashboard from `/dashboard/index.html`.

### Docker

**Build the image:**

```bash
docker build -t project-management-service:latest .
```

**Run the container:**

```bash
docker run -d \
  --name project-management-service \
  -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/projectmanagement \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=changeme \
  project-management-service:latest
```

---

## Configuration

All configuration is driven by environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | HTTP port |
| `DB_URL` | `jdbc:postgresql://localhost:5432/projectmanagement` | JDBC URL |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `changeme` | Database password |
| `JPA_DDL_AUTO` | `validate` | Hibernate DDL mode |
| `CALENDAR_SERVICE_URL` | `http://localhost:8081` | External calendar service base URL |
| `REPORTING_SERVICE_URL` | `http://localhost:8082` | External reporting service base URL |
| `LOG_LEVEL` | `INFO` | Application log level |

---

## API Reference

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Returns service health status |

### Projects

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/projects` | Create a new project |
| `GET` | `/api/v1/projects` | List all projects (optional `?status=` or `?ownerId=`) |
| `GET` | `/api/v1/projects/{id}` | Get a project by ID |
| `PUT` | `/api/v1/projects/{id}` | Update project details |
| `POST` | `/api/v1/projects/{id}/activate` | Transition project to ACTIVE |
| `POST` | `/api/v1/projects/{id}/complete` | Transition project to COMPLETED |
| `POST` | `/api/v1/projects/{id}/archive` | Archive a project |
| `DELETE` | `/api/v1/projects/{id}` | Delete a project |

### Resource allocation dashboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/resource-allocation` | Returns the latest allocation totals and per-project resource assignments |

The response is marked `Cache-Control: no-store`. Dashboard clients request a
fresh snapshot every five seconds so changes written by integrated project
management tools are visible without a manual refresh.

**Example — create a project:**

```bash
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Full redesign of the company website",
    "startDate": "2025-01-01",
    "endDate": "2025-06-30",
    "ownerId": "user-123"
  }'
```

---

## Running Tests

```bash
# All tests
./mvnw test

# With coverage report
./mvnw verify

# Dashboard typecheck, tests, and production build
cd dashboard-ui
npm run lint
npm test
npm run build
```

---

## Project Structure

```
src/
├── main/
│   ├── java/com/projectmanagement/
│   │   ├── ProjectManagementApplication.java   # Entry point
│   │   ├── domain/
│   │   │   ├── model/          # Project, ProjectStatus
│   │   │   ├── port/
│   │   │   │   ├── in/         # ProjectUseCase (input port)
│   │   │   │   └── out/        # ProjectRepository, CalendarServicePort, ReportingServicePort
│   │   │   └── exception/      # Domain exceptions
│   │   ├── application/
│   │   │   └── service/        # ProjectService (use case implementation)
│   │   ├── infrastructure/
│   │   │   ├── persistence/    # JPA entity, mapper, adapter, Spring Data repo
│   │   │   └── external/       # Calendar & Reporting stub adapters
│   │   └── web/
│   │       ├── controller/     # ProjectController, HealthController
│   │       ├── dto/            # Request/Response DTOs
│   │       └── exception/      # GlobalExceptionHandler
│   └── resources/
│       ├── application.properties
│       └── db/migration/       # Flyway SQL migrations
└── test/
    └── java/com/projectmanagement/
        ├── web/controller/     # HealthControllerTest, ProjectControllerTest
        └── application/service/ # ProjectServiceTest
```
