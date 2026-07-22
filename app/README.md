# User Account Management Service

A production-ready microservice for user registration, credential management, and authentication — built with **Node.js + Express** following **hexagonal (ports & adapters) architecture**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [Environment Variables](#environment-variables)
8. [Running Tests](#running-tests)
9. [Docker](#docker)
10. [Security Considerations](#security-considerations)

---

## Overview

This service is responsible for:

- **User registration** — validate, sanitise, and persist new accounts
- **Credential management** — bcrypt-hashed passwords, uniqueness constraints
- **Authentication** — email/password login with JWT issuance
- **OAuth2 / OpenID Connect** integration (callback stub, extendable)
- **Notification dispatch** — registration emails and SMS verification codes via RabbitMQ
- **Audit logging** — structured JSON logs for compliance and observability

---

## Architecture

The codebase follows **hexagonal architecture** (also known as *ports and adapters*):

```
┌────────────────────────────────────────────────────────────┐
│                        Adapters (in)                       │
│   HTTP Controllers → Express Routes → Middleware           │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                    Application Layer                        │
│   Use-cases: RegisterUser, AuthenticateUser, GetUser        │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                      Domain Layer                           │
│   Entities: User   Errors: DomainError family              │
│   Ports: IUserRepository, IPasswordHasher,                 │
│          INotificationService                              │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                   Adapters (out)                            │
│   PostgresUserRepository  BcryptPasswordHasher             │
│   RabbitMQNotificationService  JwtService                  │
└────────────────────────────────────────────────────────────┘
```

Concrete adapters are wired together in `src/container.js` (the composition root). Swapping an adapter — e.g. replacing RabbitMQ with AWS SQS — requires a change only in that file.

---

## Technology Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20 (LTS) |
| Framework | Express 4 |
| Database | PostgreSQL (via `pg`) |
| Auth tokens | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | bcryptjs |
| Message queue | RabbitMQ (`amqplib`) |
| Validation | express-validator |
| Logging | Winston (structured JSON) |
| Testing | Jest + Supertest |
| Container | Docker (multi-stage) |

---

## Project Structure

```
src/
├── app.js                          # Express app factory
├── index.js                        # Bootstrap / server entry point
├── container.js                    # Composition root (DI wiring)
│
├── domain/
│   ├── entities/User.js            # User aggregate root
│   ├── errors/DomainError.js       # Domain error hierarchy
│   └── ports/
│       ├── IUserRepository.js      # Persistence port
│       ├── IPasswordHasher.js      # Hashing port
│       └── INotificationService.js # Notification port
│
├── application/
│   └── usecases/
│       ├── RegisterUser.js
│       ├── GetUser.js
│       └── AuthenticateUser.js
│
├── adapters/
│   ├── http/
│   │   ├── controllers/            # HealthController, UserController, AuthController
│   │   ├── routes/                 # health, user, auth route files
│   │   └── middleware/             # errorHandler, requestId, authenticate, validators
│   ├── persistence/
│   │   ├── PostgresUserRepository.js
│   │   └── InMemoryUserRepository.js  # for tests
│   ├── messaging/
│   │   ├── RabbitMQNotificationService.js
│   │   └── NoopNotificationService.js
│   └── security/
│       └── BcryptPasswordHasher.js
│
└── infrastructure/
    ├── logger.js
    ├── auth/JwtService.js
    ├── database/
    │   ├── connection.js
    │   └── migrate.js
    └── messaging/connection.js

tests/
├── health.test.js
├── user.registration.test.js
├── auth.test.js
└── unit/
    ├── User.entity.test.js
    └── RegisterUser.usecase.test.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- RabbitMQ 3.x (optional — service degrades gracefully)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DB credentials and secrets

# 3. Run database migrations
npm run migrate

# 4. Start the service
npm run dev        # development (nodemon)
npm start          # production
```

---

## API Reference

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Liveness check |

**Response 200**
```json
{
  "status": "ok",
  "service": "user-account-management-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 42.5
}
```

---

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/users/register` | None | Register a new user |
| GET | `/api/v1/users/:id` | Bearer JWT | Get user by ID |

#### POST `/api/v1/users/register`

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass1",
  "mobile": "+15551234567",
  "firstName": "Alice",
  "lastName": "Smith"
}
```

**Response 201**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "alice@example.com",
    "mobile": "+15551234567",
    "firstName": "Alice",
    "lastName": "Smith",
    "status": "PENDING_VERIFICATION",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | None | Login; returns JWT |
| GET | `/api/v1/auth/callback` | None | OAuth2 OIDC callback (stub) |

#### POST `/api/v1/auth/login`

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass1"
}
```

**Response 200**
```json
{
  "status": "success",
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": "...", "email": "..." }
  }
}
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP listen port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_NAME` | Yes | `user_accounts` | Database name |
| `DB_USER` | Yes | `postgres` | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `BCRYPT_SALT_ROUNDS` | No | `12` | bcrypt cost factor |
| `RABBITMQ_URL` | No | `amqp://localhost` | RabbitMQ connection URL |

---

## Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage
```

Tests use an **in-memory repository** and a **no-op notification service** — no external dependencies required.

---

## Docker

```bash
# Build
docker build -t user-account-management-service .

# Run
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=changeme \
  -e JWT_SECRET=your_secret \
  user-account-management-service
```

A `docker-compose.yml` can be added to spin up PostgreSQL and RabbitMQ alongside the service for local development.

---

## Security Considerations

- Passwords are hashed with **bcrypt** (configurable cost factor, default 12)
- JWTs are short-lived (default 1 hour); rotate `JWT_SECRET` regularly
- The `X-Request-Id` header is propagated for distributed tracing
- Helmet sets secure HTTP headers on every response
- User-enumeration is prevented — login always returns `INVALID_CREDENTIALS` regardless of whether the email exists
- Input is validated and sanitised before reaching the domain layer
- The Docker image runs as a **non-root user**
