# AGENTS.md — Event Processing Service

## 1. Stack

| Technology / Library | Role |
|---|---|
| **Node.js 20 LTS** | Runtime environment |
| **TypeScript 5.x** | Primary language; strict mode enabled |
| **KafkaJS** | Kafka consumer/producer client |
| **amqplib** | RabbitMQ AMQP 0-9-1 client |
| **Zod** | Runtime schema validation for event payloads |
| **Pino** | Structured JSON logging |
| **Vitest** | Unit and integration test runner |
| **@testcontainers/kafka** | Ephemeral Kafka broker for integration tests |
| **@testcontainers/rabbitmq** | Ephemeral RabbitMQ broker for integration tests |
| **ESLint + Prettier** | Linting and formatting |
| **tsx** | TypeScript execution for local dev |
| **Docker / docker-compose** | Container runtime and local orchestration |
| **GitHub Actions** | CI pipeline |

---

## 2. Project Structure

```
event-processing-service/
├── src/
│   ├── config/
│   │   ├── index.ts            # Centralised config loader (env vars via zod)
│   │   ├── kafka.config.ts     # KafkaJS client configuration
│   │   └── rabbitmq.config.ts  # amqplib connection configuration
│   ├── consumers/
│   │   ├── kafka/
│   │   │   ├── index.ts        # Registers all Kafka consumer groups
│   │   │   ├── project-events.consumer.ts   # Subscribes to project-events topic
│   │   │   └── dead-letter.consumer.ts      # DLQ consumer for failed events
│   │   └── rabbitmq/
│   │       ├── index.ts        # Registers all AMQP queue consumers
│   │       └── notification.consumer.ts     # Consumes notification queue messages
│   ├── producers/
│   │   ├── kafka/
│   │   │   └── event.producer.ts   # Publishes events to Kafka topics
│   │   └── rabbitmq/
│   │       └── notification.producer.ts  # Publishes to RabbitMQ notification exchange
│   ├── handlers/
│   │   ├── project-created.handler.ts   # Business logic for project.created events
│   │   ├── project-updated.handler.ts   # Business logic for project.updated events
│   │   ├── project-deleted.handler.ts   # Business logic for project.deleted events
│   │   └── index.ts                     # Handler registry / dispatcher
│   ├── notifications/
│   │   ├── notification.service.ts  # Orchestrates notification delivery
│   │   ├── email.notifier.ts        # Email notification strategy
│   │   └── webhook.notifier.ts      # Webhook notification strategy
│   ├── schemas/
│   │   ├── project-event.schema.ts  # Zod schemas for all project event types
│   │   └── notification.schema.ts   # Zod schemas for notification payloads
│   ├── middleware/
│   │   ├── retry.middleware.ts      # Exponential back-off retry wrapper
│   │   └── error-handler.ts        # Centralised error classification & DLQ routing
│   ├── utils/
│   │   ├── logger.ts               # Pino logger singleton
│   │   └── correlation-id.ts       # Correlation ID generation and propagation
│   ├── types/
│   │   ├── events.types.ts         # TypeScript interfaces for all event shapes
│   │   └── common.types.ts         # Shared utility types
│   └── main.ts                     # Entry point; bootstraps consumers and producers
├── tests/
│   ├── unit/
│   │   ├── handlers/
│   │   │   ├── project-created.handler.test.ts
│   │   │   ├── project-updated.handler.test.ts
│   │   │   └── project-deleted.handler.test.ts
│   │   ├── notifications/
│   │   │   └── notification.service.test.ts
│   │   ├── middleware/
│   │   │   └── retry.middleware.test.ts
│   │   └── schemas/
│   │       └── project-event.schema.test.ts
│   ├── integration/
│   │   ├── kafka/
│   │   │   └── project-events.consumer.integration.test.ts
│   │   └── rabbitmq/
│   │       └── notification.consumer.integration.test.ts
│   └── helpers/
│       ├── kafka.test-helper.ts     # Testcontainers Kafka setup/teardown
│       └── rabbitmq.test-helper.ts  # Testcontainers RabbitMQ setup/teardown
├── docker/
│   ├── Dockerfile
│   └── Dockerfile.dev
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── docker-compose.test.yml
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vitest.config.ts
├── tasks.md                         # Agent-generated task tracking file
└── package.json
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

### Step 1 — Read Specifications
- Read all story-level spec documents provided in the repository or prompt context.
- Identify all event types, topics, queue names, routing keys, payload schemas, and notification targets.
- Note any SLA requirements (retry limits, DLQ thresholds, delivery guarantees).

### Step 2 — Create `tasks.md`
- Create `tasks.md` at the project root **before writing any source code**.
- Structure it with the following sections:
  ```markdown
  # Tasks
  ## Backlog
  ## In Progress
  ## Done
  ```
- Decompose the implementation into granular tasks (one responsibility per task).
- Each task must include: task ID, description, acceptance criteria, and affected files.
- Move tasks to **In Progress** when starting them and **Done** when tests pass.

### Step 3 — Scaffold the Project
- Initialise `package.json` with `npm init -y`.
- Install all dependencies listed in Section 1.
- Generate `tsconfig.json` with `strict: true`, `target: ES2022`, `module: NodeNext`.
- Create `.env.example` with every required environment variable documented.
- Scaffold all directories and placeholder files from Section 2.

### Step 4 — Implement Configuration
- Implement `src/config/index.ts` first; all other modules must import config from here.
- Use Zod to validate every environment variable at startup; throw on missing required vars.
- Implement `kafka.config.ts` and `rabbitmq.config.ts` as pure config factories (no side effects).

### Step 5 — Implement Schemas
- Define all Zod schemas in `src/schemas/` before implementing handlers.
- Export inferred TypeScript types from each schema file (e.g., `export type ProjectCreatedEvent = z.infer<typeof ProjectCreatedEventSchema>`).

### Step 6 — Implement Core Logic
- Implement handlers in `src/handlers/` — pure functions with no direct broker imports.
- Implement notification strategies in `src/notifications/`.
- Implement retry middleware and error handler in `src/middleware/`.

### Step 7 — Implement Consumers and Producers
- Wire Kafka consumers in `src/consumers/kafka/`.
- Wire RabbitMQ consumers in `src/consumers/rabbitmq/`.
- Each consumer must: validate the payload with Zod, dispatch to the correct handler, handle errors via `error-handler.ts`.
- Implement producers and ensure idempotency headers are set on every message.

### Step 8 — Implement `main.ts`
- Bootstrap order: load config → connect Kafka → connect RabbitMQ → register consumers → attach shutdown hooks.
- Implement graceful shutdown: disconnect consumers before producers, flush in-flight messages, close broker connections.

### Step 9 — Write Tests
- Write unit tests first (see Section 5).
- Write integration tests using Testcontainers (see Section 5).
- Run `npm run test:coverage` and confirm ≥ 90% line/branch/function coverage.

### Step 10 — Validate
- Run `npm run lint` — zero errors permitted.
- Run `npm run typecheck` — zero TypeScript errors permitted.
- Run `npm run test` — all tests green.
- Run `docker compose build` — image must build successfully.
- Update all tasks in `tasks.md` to **Done**.

---

## 4. Coding Conventions

### Naming
| Construct | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `project-created.handler.ts` |
| Classes | `PascalCase` | `NotificationService` |
| Interfaces | `PascalCase` prefixed with `I` | `IEventHandler` |
| Type aliases | `PascalCase` | `ProjectCreatedEvent` |
| Functions / methods | `camelCase` | `handleProjectCreated()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Kafka topics | `kebab-case` | `project-events` |
| RabbitMQ exchanges | `kebab-case` | `notification-exchange` |
| RabbitMQ queues | `kebab-case` | `notification-queue` |
| RabbitMQ routing keys | `dot.notation` | `project.created` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `KAFKA_BROKERS` |

### Architecture Patterns
- **Handlers are pure**: handlers receive a typed, validated event object and return a result; they never import `kafkajs` or `amqplib` directly.
- **Dependency injection via constructor**: consumers accept handler and notifier instances; never instantiate dependencies inside consumer classes.
- **Single Responsibility**: one handler file per event type; one consumer file per topic or queue.
- **Schema-first**: every inbound message is validated through Zod before any handler is called; invalid messages are routed to the DLQ.
- **Correlation IDs**: every log line and outbound message must carry a `correlationId`; generate one at consumer ingress if not present.
- **No `any`**: TypeScript `any` is forbidden; use `unknown` for untyped boundaries and narrow with Zod.
- **Error classification**: errors must be classified as `RetryableError` or `FatalError`; fatal errors skip retries and go directly to the DLQ.

### Style
- Prettier config: `printWidth: 100`, `singleQuote: true`, `trailingComma: 'all'`, `semi: true`.
- ESLint extends: `eslint:recommended`, `@typescript-eslint/recommended`, `@typescript-eslint/strict`.
- No barrel `index.ts` re-exports except where explicitly listed in the project structure.
- Async functions must always have explicit return types.

---

## 5. Testing

### Unit Tests
- Location: `tests/unit/`
- Framework: **Vitest**
- All broker clients (KafkaJS, amqplib) must be **mocked** using `vi.mock()` — no real brokers in unit tests.
- Each handler test must cover: happy path, schema validation failure, retryable error, fatal error.
- Each schema test must cover: valid payload, missing required fields, wrong field types, extra fields (strip behaviour).

**Example unit test skeleton:**
```typescript
// tests/unit/handlers/project-created.handler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleProjectCreated } from '../../../src/handlers/project-created.handler';
import { NotificationService } from '../../../src/notifications/notification.service';

vi.mock('../../../src/notifications/notification.service');

describe('handleProjectCreated', () => {
  it('should trigger notification on valid event', async () => {
    // arrange
    // act
    // assert
  });

  it('should throw RetryableError when notification service is unavailable', async () => {
    // arrange
    // act
    // assert
  });
});
```

### Integration Tests
- Location: `tests/integration/`
- Use **Testcontainers** to spin up real Kafka and RabbitMQ instances per test suite.
- Each integration test must verify end-to-end: publish event → consumer processes → handler invoked → notification produced.
- Testcontainers setup/teardown must use `beforeAll` / `afterAll` hooks in helpers.
- Integration tests run with `npm run test:integration` using a separate Vitest config.

### Coverage
- Target: **≥ 90%** lines, branches, and functions.
- Run: `npm run test:coverage`
- Coverage provider: `v8`
- Fail the build if coverage drops below threshold.

**`vitest.config.ts` coverage thresholds:**
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 90,
    branches: 90,
    functions: 90,
  },
  exclude: ['src/main.ts', 'src/config/**', 'tests/**'],
},
```

### NPM Scripts
```json
"scripts": {
  "build": "tsc --project tsconfig.json",
  "start": "node dist/main.js",
  "dev": "tsx watch src/main.ts",
  "lint": "eslint 'src/**/*.ts' 'tests/**/*.ts'",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:integration": "vitest run --config vitest.integration.config.ts"
}
```

---

## 6. Docker & CI

### `docker/Dockerfile` (production)
```dockerfile
# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2 — runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/main.js"]
```

### `docker-compose.yml` (local development)
```yaml
services:
  event-processing-service:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    env_file: .env
    depends_on:
      kafka:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./src:/app/src

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"