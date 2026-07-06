# Notification Worker

A NestJS-based integration service that consumes project lifecycle events from RabbitMQ and dispatches notifications to users via **email** (SendGrid), **push** (Firebase FCM), and **in-app** channels.

---

## Table of Contents

- [Architecture](#architecture)
- [Responsibilities](#responsibilities)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [Testing](#testing)
- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Project Structure](#project-structure)

---

## Architecture

The service follows **Hexagonal Architecture** (Ports & Adapters):

```
src/
├── domain/           # Core business logic — no framework dependencies
│   ├── entities/     # ProjectEvent, Notification, NotificationPreference
│   ├── enums/        # NotificationChannel, ProjectEventType
│   ├── errors/       # Domain-specific error types
│   └── ports/        # Interfaces (INotificationDispatcher, ITemplateRenderer, …)
│
├── application/      # Use-cases orchestrating domain objects
│   └── use-cases/    # ProcessProjectEventUseCase
│
├── infrastructure/   # Adapters implementing domain ports
│   ├── adapters/
│   │   ├── email/        # SendGrid adapter
│   │   ├── push/         # Firebase FCM adapter
│   │   ├── in-app/       # In-app notification adapter
│   │   ├── messaging/    # RabbitMQ consumer
│   │   ├── preferences/  # Notification preference repository
│   │   ├── idempotency/  # Idempotency store (in-memory / Redis)
│   │   └── template/     # Handlebars template renderer
│   └── config/           # NestJS ConfigModule configuration
│
└── interfaces/       # Inbound HTTP interfaces
    └── http/
        └── health/   # GET /health endpoint (Terminus)
```

---

## Responsibilities

| Responsibility | Implementation |
|---|---|
| Consume `project.created`, `project.updated`, `project.deleted` events | `RabbitMQConsumer` |
| Apply per-user notification preferences (opt-in/opt-out) | `ProcessProjectEventUseCase` + `INotificationPreferenceRepository` |
| Render notification content from templates | `HandlebarsTemplateRenderer` |
| Dispatch email notifications | `SendGridEmailDispatcher` |
| Dispatch push notifications | `FirebasePushDispatcher` |
| Retry with exponential backoff on transient failures | `ProcessProjectEventUseCase.dispatchWithRetry()` |
| Route undeliverable notifications to DLQ | `RabbitMQConsumer` (nack without requeue) |
| Idempotent processing (prevent duplicate notifications) | `InMemoryIdempotencyStore` / Redis adapter |

---

## Technology Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS 10 |
| Message Broker | RabbitMQ (amqplib) |
| Email | SendGrid (`@sendgrid/mail`) |
| Push | Firebase Admin SDK (FCM) |
| Templates | Handlebars |
| Idempotency | In-memory (dev) / Redis (prod) |
| Observability | Prometheus + OpenTelemetry |
| Containerisation | Docker |
| Orchestration | Kubernetes |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 9
- A running RabbitMQ instance
- (Optional) SendGrid API key, Firebase service account

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

---

## Configuration

All configuration is driven by environment variables. See [`.env.example`](.env.example) for the full list.

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://guest:guest@localhost:5672` |
| `RABBITMQ_EXCHANGE` | Topic exchange name | `project.events` |
| `RABBITMQ_QUEUE` | Consumer queue name | `notification-worker` |
| `RABBITMQ_DLQ` | Dead-letter queue name | `notification-worker.dlq` |
| `RABBITMQ_PREFETCH` | Consumer prefetch count | `10` |
| `SENDGRID_API_KEY` | SendGrid API key | — |
| `SENDGRID_FROM_EMAIL` | Sender email address | `noreply@example.com` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | — |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | — |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (newlines as `\n`) | — |
| `REDIS_HOST` | Redis host (idempotency store) | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `IDEMPOTENCY_TTL_SECONDS` | TTL for processed event IDs | `86400` |

---

## Running the Service

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Health check

```
GET http://localhost:3000/health
```

Returns `200 OK` with a JSON body describing memory and disk health indicators.

---

## Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

---

## Docker

```bash
# Build image
docker build -t notification-worker:latest .

# Run container
docker run --rm \
  --env-file .env \
  -p 3000:3000 \
  notification-worker:latest
```

---

## Kubernetes

The service is designed for independent horizontal scaling of consumer replicas:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-worker
spec:
  replicas: 3          # Scale independently
  selector:
    matchLabels:
      app: notification-worker
  template:
    metadata:
      labels:
        app: notification-worker
    spec:
      containers:
        - name: notification-worker
          image: notification-worker:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: notification-worker-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

---

## Project Structure

```
notification-worker/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── interfaces/
├── test/
│   ├── health.e2e-spec.ts
│   ├── unit/
│   │   └── process-project-event.use-case.spec.ts
│   └── jest-e2e.json
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```
