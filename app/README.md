# User Management Service

A production-ready **User Management Service** built with **Node.js** and **Express.js**, following **Hexagonal Architecture** (Ports & Adapters). It handles user profile creation/updates, authentication, and JWT-based session management.

---

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Running Tests](#running-tests)
- [Docker](#docker)
- [Project Structure](#project-structure)

---

## Architecture

This service follows **Hexagonal Architecture** (also known as Ports & Adapters):

```
┌─────────────────────────────────────────────────────────┐
│                    Driving Adapters                      │
│              (HTTP Controllers / Routes)                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Application Core                       │
│         (Use Cases / Application Services)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Domain Layer                         │   │
│  │   (Entities, Value Objects, Domain Services)      │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Driven Adapters                        │
│         (Repositories, Token Provider, etc.)             │
└─────────────────────────────────────────────────────────┘
```

- **Domain** — pure business logic, no framework dependencies
- **Application** — use cases that orchestrate domain objects
- **Ports** — interfaces (contracts) the application exposes or depends on
- **Adapters** — concrete implementations of ports (HTTP, in-memory/DB, JWT)

---

## Technology Stack

| Layer        | Technology                  |
|--------------|-----------------------------|
| Runtime      | Node.js ≥ 18                |
| Framework    | Express.js 4                |
| Auth         | JWT (jsonwebtoken), bcryptjs|
| Validation   | express-validator           |
| Logging      | Winston                     |
| Testing      | Jest + Supertest            |
| Container    | Docker                      |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd user-management-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start the service
npm start

# Development mode (auto-reload)
npm run dev
```

---

## Environment Variables

See [.env.example](.env.example) for all available variables.

| Variable              | Description                              | Default       |
|-----------------------|------------------------------------------|---------------|
| `PORT`                | HTTP port the service listens on         | `3000`        |
| `NODE_ENV`            | Runtime environment                      | `development` |
| `JWT_SECRET`          | Secret key for signing JWTs              | *(required)*  |
| `JWT_EXPIRES_IN`      | JWT expiry duration                      | `1h`          |
| `JWT_REFRESH_SECRET`  | Secret key for signing refresh tokens    | *(required)*  |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry duration         | `7d`          |
| `BCRYPT_SALT_ROUNDS`  | bcrypt hashing rounds                    | `12`          |
| `LOG_LEVEL`           | Winston log level                        | `info`        |

---

## API Endpoints

### Health

| Method | Path       | Description              |
|--------|------------|--------------------------|
| GET    | `/health`  | Service health check     |

### Authentication

| Method | Path                 | Auth required | Description                     |
|--------|----------------------|---------------|---------------------------------|
| POST   | `/auth/register`     | No            | Register a new user             |
| POST   | `/auth/login`        | No            | Authenticate and get tokens     |
| POST   | `/auth/refresh`      | No            | Exchange refresh → access token |

### Users

| Method | Path          | Auth required | Description                  |
|--------|---------------|---------------|------------------------------|
| GET    | `/users/:id`  | Yes           | Get a user's public profile  |
| PATCH  | `/users/:id`  | Yes           | Update a user's profile      |

> All `/users/*` endpoints require `Authorization: Bearer <access_token>` header.
> A user may only access their own profile unless they have the `admin` role.

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

---

## Docker

```bash
# Build the image
docker build -t user-management-service .

# Run the container
docker run -p 3000:3000 --env-file .env user-management-service

# Or with docker-compose (if available)
docker-compose up
```

---

## Project Structure

```
user-management-service/
├── src/
│   ├── index.js                        # Entry point
│   ├── app.js                          # Express app factory
│   ├── domain/                         # Domain layer (pure business logic)
│   │   ├── entities/
│   │   │   └── User.js                 # User entity
│   │   ├── value-objects/
│   │   │   ├── Email.js                # Email value object
│   │   │   └── Password.js             # Password value object
│   │   └── errors/
│   │       └── DomainError.js          # Domain error types
│   ├── application/                    # Application layer (use cases)
│   │   ├── ports/
│   │   │   ├── inbound/
│   │   │   │   └── IAuthService.js     # Inbound port (interface)
│   │   │   └── outbound/
│   │   │       ├── IUserRepository.js  # Outbound port
│   │   │       └── ITokenProvider.js   # Outbound port
│   │   └── use-cases/
│   │       ├── RegisterUser.js
│   │       ├── LoginUser.js
│   │       ├── RefreshToken.js
│   │       ├── GetUserProfile.js
│   │       └── UpdateUserProfile.js
│   ├── adapters/                       # Adapter layer
│   │   ├── inbound/
│   │   │   └── http/
│   │   │       ├── controllers/
│   │   │       │   ├── AuthController.js
│   │   │       │   ├── UserController.js
│   │   │       │   └── HealthController.js
│   │   │       ├── middleware/
│   │   │       │   ├── authMiddleware.js
│   │   │       │   ├── errorHandler.js
│   │   │       │   └── requestLogger.js
│   │   │       ├── validators/
│   │   │       │   ├── authValidators.js
│   │   │       │   └── userValidators.js
│   │   │       └── routes/
│   │   │           ├── authRoutes.js
│   │   │           ├── userRoutes.js
│   │   │           └── healthRoutes.js
│   │   └── outbound/
│   │       ├── persistence/
│   │       │   └── InMemoryUserRepository.js
│   │       └── security/
│   │           └── JwtTokenProvider.js
│   └── config/
│       └── index.js                    # Configuration loader
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── User.test.js
│   │   │   └── Email.test.js
│   │   └── use-cases/
│   │       ├── RegisterUser.test.js
│   │       └── LoginUser.test.js
│   └── integration/
│       ├── health.test.js
│       ├── auth.test.js
│       └── users.test.js
├── Dockerfile
├── .dockerignore
├── .env.example
├── .eslintrc.json
├── package.json
└── README.md
```
