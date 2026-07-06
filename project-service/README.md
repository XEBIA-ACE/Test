# Project Service

A RESTful microservice for managing projects, built with **NestJS** (TypeScript) following **hexagonal architecture** (ports & adapters).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Docker](#docker)

---

## Overview

The Project Service exposes a CRUD REST API for project resources and enforces:

- **RBAC** — Admin, Project Manager, Viewer roles via JWT claims
- **Optimistic locking** — version column; HTTP 409 on conflict
- **Soft-delete** — `is_deleted`, `deleted_at`, `deleted_by`; no physical removal
- **Read-through cache** — Redis; invalidated on every write
- **Domain events** — `ProjectCreated`, `ProjectUpdated`, `ProjectDeleted` published to RabbitMQ
- **Audit trail** — `created_at`, `created_by`, `updated_at`, `updated_by` on every record
- **Pagination & filtering** — by status, owner, name, date range

---

## Architecture

```
src/
├── domain/                  # Core business logic (no framework deps)
│   ├── entities/            # Project domain entity
│   ├── events/              # Domain events (ProjectCreated, etc.)
│   └── ports/               # Repository, EventPublisher, Cache interfaces
│
├── application/             # Use cases (orchestrate domain + ports)
│   ├── auth/                # AuthContext, Role enum
│   └── use-cases/           # CreateProject, GetProject, ListProjects, UpdateProject, DeleteProject
│
├── infrastructure/          # Adapters (implement ports)
│   ├── persistence/typeorm/ # TypeORM ORM entity + repository adapter
│   ├── cache/               # Redis adapter (ioredis)
│   └── messaging/           # RabbitMQ adapter (@golevelup/nestjs-rabbitmq)
│
├── interfaces/              # HTTP layer
│   └── http/
│       ├── controllers/     # ProjectsController, HealthController
│       ├── dtos/            # Request/Response DTOs (class-validator)
│       ├── guards/          # JwtAuthGuard
│       └── decorators/      # @CurrentUser()
│
├── modules/                 # NestJS feature modules
├── app.module.ts            # Root module
└── main.ts                  # Bootstrap
```

---

## Technology Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS 10 (TypeScript) |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| Message Broker | RabbitMQ 3.12 |
| Auth | JWT / OAuth2 (jsonwebtoken) |
| Validation | class-validator / class-transformer |
| API Docs | Swagger / OpenAPI |
| Containerisation | Docker |
| Orchestration | Kubernetes |
| Migrations | SQL (Flyway-compatible V1__ naming) |
| Observability | Prometheus + OpenTelemetry |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker & Docker Compose

### Local development (Docker Compose)

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start all services (app + postgres + redis + rabbitmq)
docker-compose up --build

# 3. The API is available at http://localhost:3000
# 4. Swagger UI: http://localhost:3000/api/docs
```

### Local development (bare metal)

```bash
npm install

# Start dependencies separately (postgres, redis, rabbitmq)
# then:
npm run start:dev
```

---

## Environment Variables

See [.env.example](.env.example) for the full list.

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `RABBITMQ_URL` | RabbitMQ AMQP URL | `amqp://localhost:5672` |
| `JWT_SECRET` | Secret for verifying JWT tokens | — |

---

## API Reference

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/health` | Health check | Public |
| `POST` | `/projects` | Create project | Admin, PM |
| `GET` | `/projects` | List projects (paginated) | All |
| `GET` | `/projects/:id` | Get project by ID | All |
| `PUT` | `/projects/:id` | Update project | Admin, PM |
| `DELETE` | `/projects/:id` | Soft-delete project | Admin |

Full interactive docs available at `/api/docs` (Swagger UI).

### Optimistic Locking

Include the current `version` in `PUT` request body. If the version has changed since you last read the resource, the server returns **HTTP 409 Conflict** with a descriptive message.

---

## Running Tests

```bash
# Unit + integration tests
npm test

# With coverage
npm run test:cov

# Watch mode
npm run test:watch
```

Test suites cover:
- `HealthController` — unit + HTTP integration
- `Project` domain entity — update, soft-delete, version increment
- `CreateProjectUseCase` — RBAC, event publishing, cache invalidation
- `UpdateProjectUseCase` — optimistic locking, RBAC, not-found
- `DeleteProjectUseCase` — soft-delete, RBAC, not-found

---

## Docker

```bash
# Build image
docker build -t project-service:latest .

# Run container
docker run -p 3000:3000 --env-file .env project-service:latest
```

The image uses a multi-stage build (builder → production) and includes a `HEALTHCHECK` that polls `/health`.

---

## Architecture

```
src/
├── domain/                  # Core business logic (no framework dependencies)
│   ├── entities/            # Project domain entity
│   ├── events/              # Domain events (ProjectCreated, ProjectUpdated, ProjectDeleted)
│   └── ports/               # Interfaces: ProjectRepository, EventPublisher, CachePort
│
├── application/             # Use cases (orchestrate domain + ports)
│   ├── auth/                # AuthContext, Role enum
│   └── use-cases/           # CreateProject, GetProject, ListProjects, UpdateProject, DeleteProject
│
├── infrastructure/          # Adapters (implement ports)
│   ├── persistence/typeorm/ # TypeORM ORM entity + repository adapter
│   ├── cache/               # Redis adapter (ioredis)
│   └── messaging/           # RabbitMQ adapter (@golevelup/nestjs-rabbitmq)
│
├── interfaces/              # Inbound adapters
│   └── http/
│       ├── controllers/     # ProjectsController, HealthController
│       ├── dtos/            # Request/response DTOs with class-validator
│       ├── guards/          # JwtAuthGuard
│       └── decorators/      # @CurrentUser()
│
├── modules/                 # NestJS feature modules
├── app.module.ts            # Root module
└── main.ts                  # Bootstrap
```

---

## Technology Stack

| Concern            | Technology                          |
|--------------------|-------------------------------------|
| Runtime            | Node.js 20 / TypeScript             |
| Framework          | NestJS                              |
| ORM                | TypeORM                             |
| Database           | PostgreSQL                          |
| Cache              | Redis (ioredis)                     |
| Message Broker     | RabbitMQ (@golevelup/nestjs-rabbitmq)|
| Validation         | class-validator / class-transformer |
| Auth               | JWT (jsonwebtoken)                  |
| API Docs           | Swagger / OpenAPI                   |
| Containerisation   | Docker                              |
| Migrations         | SQL migration files (Flyway-compatible) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL
- Redis
- RabbitMQ

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your local values
```

### Run database migrations

Apply the SQL files in `migrations/` using Flyway or `psql`:

```bash
psql $DATABASE_URL -f migrations/V1__create_projects_table.sql
```

### Start in development mode

```bash
npm run start:dev
```

The service will be available at `http://localhost:3000`.  
Swagger UI: `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable       | Description                              | Default                                      |
|----------------|------------------------------------------|----------------------------------------------|
| `NODE_ENV`     | Runtime environment                      | `development`                                |
| `PORT`         | HTTP port                                | `3000`                                       |
| `DATABASE_URL` | PostgreSQL connection string             | `postgresql://postgres:password@localhost:5432/project_service` |
| `REDIS_URL`    | Redis connection URL                     | `redis://localhost:6379`                     |
| `RABBITMQ_URL` | RabbitMQ AMQP URL                        | `amqp://guest:guest@localhost:5672`          |
| `JWT_SECRET`   | Secret for verifying JWT tokens          | *(required)*                                 |

---

## API Reference

| Method | Path              | Description                          | Auth Required |
|--------|-------------------|--------------------------------------|---------------|
| GET    | `/health`         | Health check                         | No            |
| POST   | `/projects`       | Create a project                     | Admin / PM    |
| GET    | `/projects`       | List projects (paginated, filtered)  | Any role      |
| GET    | `/projects/:id`   | Get a project by ID                  | Any role      |
| PUT    | `/projects/:id`   | Update a project (optimistic lock)   | Admin / PM    |
| DELETE | `/projects/:id`   | Soft-delete a project                | Admin         |

Full OpenAPI spec available at `/api/docs` when the service is running.

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

---

## Docker

### Build image

```bash
docker build -t project-service:latest .
```

### Run container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/project_service \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RABBITMQ_URL=amqp://guest:guest@host.docker.internal:5672 \
  -e JWT_SECRET=your-secret \
  project-service:latest
```
