# AGENTS.md — User Account Management Service

## 1. Stack

| Technology | Role |
|---|---|
| **Node.js 20 LTS + Express 4.x** | Primary runtime and HTTP framework |
| **TypeScript 5.x** | Type safety across all source files |
| **PostgreSQL 15** | Primary persistence (user records, audit logs) |
| **Prisma 5.x** | ORM, schema management, and migrations |
| **Redis 7** | Session cache, idempotency keys, rate-limit counters |
| **RabbitMQ 3.x** (or AWS SQS via `@aws-sdk/client-sqs`) | Async notification delivery (email/SMS events) |
| **Passport.js + `openid-client`** | OAuth 2.0 / OpenID Connect integration |
| **`bcryptjs`** | Password hashing (min 12 rounds) |
| **`zod`** | Runtime input validation and sanitisation |
| **`winston` + `winston-loki`** | Structured JSON logging and audit trail |
| **`express-rate-limit`** | Brute-force and abuse protection |
| **`helmet`** | HTTP security headers |
| **`uuid` v4** | Surrogate primary keys |
| **Jest 29 + Supertest** | Unit and integration testing |
| **`@faker-js/faker`** | Test fixture generation |
| **Docker + docker-compose** | Local environment orchestration |
| **GitHub Actions** | CI pipeline |
| **ESLint + Prettier** | Linting and formatting |

---

## 2. Project Structure

```
user-account-service/
├── AGENTS.md                          # This file
├── tasks.md                           # Agent-generated task checklist (created before coding)
├── README.md                          # Human-readable service overview
├── package.json
├── tsconfig.json                      # Strict TypeScript config
├── .eslintrc.json
├── .prettierrc
├── .env.example                       # All required env vars documented, no secrets
├── .env                               # Local secrets — NEVER committed
├── .gitignore
├── docker-compose.yml                 # postgres, redis, rabbitmq, app
├── Dockerfile                         # Multi-stage production image
├── Dockerfile.dev                     # Dev image with hot-reload
│
├── prisma/
│   ├── schema.prisma                  # Data model definitions
│   └── migrations/                    # Auto-generated migration files
│
├── src/
│   ├── main.ts                        # Entry point — bootstraps app and starts server
│   ├── app.ts                         # Express app factory (no listen call)
│   │
│   ├── config/
│   │   ├── index.ts                   # Centralised config loader (reads env vars via zod)
│   │   ├── database.ts                # Prisma client singleton
│   │   ├── redis.ts                   # Redis client singleton
│   │   └── queue.ts                   # RabbitMQ/SQS client singleton
│   │
│   ├── modules/
│   │   └── users/
│   │       ├── users.router.ts        # Express Router — route definitions only
│   │       ├── users.controller.ts    # Request/response handling, no business logic
│   │       ├── users.service.ts       # Business logic, orchestration
│   │       ├── users.repository.ts    # All Prisma queries — no logic
│   │       ├── users.schemas.ts       # Zod schemas for request validation
│   │       ├── users.types.ts         # TypeScript interfaces/types for this module
│   │       └── users.errors.ts        # Domain-specific error classes
│   │
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.router.ts         # OAuth callback and token endpoints
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts        # OIDC token exchange, session management
│   │       └── auth.types.ts
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts            # Global Express error handler
│   │   ├── requestLogger.ts           # Per-request structured logging
│   │   ├── rateLimiter.ts             # express-rate-limit configuration
│   │   ├── authenticate.ts            # JWT/Bearer token verification middleware
│   │   └── validate.ts                # Zod schema validation middleware factory
│   │
│   ├── messaging/
│   │   ├── publisher.ts               # Publishes events to queue
│   │   ├── events.ts                  # Event type constants and payload interfaces
│   │   └── handlers/
│   │       └── notificationHandler.ts # Consumes notification events (if consumer lives here)
│   │
│   ├── audit/
│   │   ├── auditLogger.ts             # Writes structured audit records to DB + log sink
│   │   └── audit.types.ts             # AuditAction enum, AuditRecord interface
│   │
│   └── utils/
│       ├── crypto.ts                  # bcrypt hash/compare wrappers
│       ├── sanitise.ts                # Input normalisation helpers (trim, lowercase email)
│       └── errors.ts                  # Base AppError class, HTTP error factories
│
└── tests/
    ├── unit/
    │   ├── users/
    │   │   ├── users.service.test.ts
    │   │   ├── users.repository.test.ts
    │   │   └── users.schemas.test.ts
    │   ├── auth/
    │   │   └── auth.service.test.ts
    │   ├── middleware/
    │   │   └── validate.test.ts
    │   └── utils/
    │       ├── crypto.test.ts
    │       └── sanitise.test.ts
    ├── integration/
    │   ├── users.api.test.ts           # Supertest against real Express app + test DB
    │   └── auth.api.test.ts
    ├── fixtures/
    │   └── userFixtures.ts             # Faker-based test data factories
    └── setup/
        ├── globalSetup.ts              # Start test containers / run migrations
        └── globalTeardown.ts           # Cleanup after test suite
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder them.

### Step 1 — Read Specifications
- Read all story-level spec documents provided in the task context before writing any code.
- Identify: all API endpoints, request/response shapes, business rules, error conditions, and integration contracts.

### Step 2 — Create `tasks.md`
- Create `tasks.md` at the project root before touching any source file.
- Structure it as a Markdown checklist grouped by: Setup, Database, Modules, Middleware, Messaging, Tests, Docker, CI.
- Each task must be a single, verifiable action (e.g., `- [ ] Create Prisma User model with required fields`).
- Do not proceed to Step 3 until `tasks.md` is complete.

### Step 3 — Environment and Tooling Setup
```bash
npm init -y
npm install express prisma @prisma/client zod bcryptjs uuid passport openid-client \
  amqplib winston helmet express-rate-limit redis ioredis
npm install -D typescript ts-node-dev @types/express @types/node @types/bcryptjs \
  @types/uuid @types/amqplib jest ts-jest supertest @types/supertest \
  @faker-js/faker eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  prettier eslint-config-prettier
npx prisma init
```
- Copy `.env.example` and populate `.env` for local dev.
- Initialise `tsconfig.json` with `strict: true`, `target: ES2022`, `module: CommonJS`.

### Step 4 — Database Schema
- Define all models in `prisma/schema.prisma` before writing any service code.
- Required models: `User`, `AuditLog`.
- Run `npx prisma migrate dev --name init` to generate the first migration.

### Step 5 — Implement Modules (order matters)
1. `src/config/` — all singletons first.
2. `src/utils/` — shared utilities with no dependencies.
3. `src/audit/` — audit logger (depends on DB config only).
4. `src/messaging/` — publisher and event types.
5. `src/modules/users/` — schemas → types → errors → repository → service → controller → router.
6. `src/modules/auth/` — same layered order.
7. `src/middleware/` — validate, authenticate, rateLimiter, requestLogger, errorHandler.
8. `src/app.ts` — wire middleware and routers.
9. `src/main.ts` — start server.

### Step 6 — Write Tests Alongside Each Module
- Write unit tests immediately after implementing each file; do not batch all tests at the end.
- Mock all external dependencies (Prisma, Redis, queue) using `jest.mock()`.
- Write integration tests after all modules are complete.

### Step 7 — Validate
```bash
npm run lint          # zero errors required
npm run type-check    # tsc --noEmit — zero errors required
npm test              # all tests pass, coverage ≥ 90%
docker-compose up --build   # all services start healthy
```
- Tick off every item in `tasks.md` before marking the task done.

---

## 4. Coding Conventions

### Naming
| Artifact | Convention | Example |
|---|---|---|
| Files | `kebab-case` with module-type suffix | `users.service.ts` |
| Classes | `PascalCase` | `UserService` |
| Interfaces | `PascalCase` prefixed with `I` | `IUserRepository` |
| Types | `PascalCase` | `CreateUserPayload` |
| Functions/methods | `camelCase` | `createUser()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |
| Database tables | `snake_case` plural | `users`, `audit_logs` |
| Database columns | `snake_case` | `created_at`, `email_verified` |
| Queue event names | `SCREAMING_SNAKE_CASE` | `USER_REGISTERED`, `VERIFICATION_SENT` |

### Architecture Patterns
- **Strict layering:** Router → Controller → Service → Repository. No layer may skip another.
- **Repository pattern:** All database access lives exclusively in `*.repository.ts` files. Services never import Prisma directly.
- **Dependency injection:** Pass dependencies (repository, publisher, logger) into service constructors; do not instantiate inside service files.
- **No business logic in controllers:** Controllers only parse request, call service, and return response.
- **Zod schemas are the single source of validation truth:** Define once in `*.schemas.ts`, reuse in middleware and service types via `z.infer<>`.
- **Error handling:** Always throw typed errors (`AppError` subclasses). The global `errorHandler` middleware maps them to HTTP responses.
- **Transactions:** Use `prisma.$transaction()` for any operation that writes to more than one table (e.g., create user + create audit log).

### Security Patterns
- Sanitise all string inputs (trim, lowercase email) in `sanitise.ts` before validation.
- Hash passwords with `bcrypt` at **minimum 12 rounds** — never store plaintext.
- Never log passwords, tokens, or full credit-card/PII data. Log only user IDs and action names.
- Validate and reject unexpected fields (use `zod.strict()` on request schemas).
- Apply `helmet()` and `express-rate-limit` globally before any route handler.

### Style
- All files use `async/await`; no raw `.then()` chains.
- Explicit return types on all exported functions.
- No `any` type — use `unknown` and narrow it.
- Maximum function length: 40 lines. Extract helpers if exceeded.
- One export per file for classes/services; named exports for utilities.

---

## 5. Testing

### Framework Setup
```jsonc
// jest.config.ts
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  globalSetup: "./tests/setup/globalSetup.ts",
  globalTeardown: "./tests/setup/globalTeardown.ts",
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 90, statements: 90 }
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!src/config/*.ts"]
};
```

### Unit Tests
- **Location:** `tests/unit/<module>/`
- **Mocking:** Use `jest.mock()` to mock `../../src/config/database` (Prisma), `ioredis`, and `amqplib`.
- **Pattern:** Arrange → Act → Assert with descriptive `describe` / `it` blocks.
- **Required coverage per file:**
  - `users.service.ts` — all happy paths, all validation branches, all error conditions.
  - `users.repository.ts` — mock Prisma, assert correct query parameters.
  - `users.schemas.ts` — test valid and invalid inputs exhaustively using `zod.safeParse()`.
  - `crypto.ts` — verify hash is not plaintext, verify compare returns correct boolean.
  - `auditLogger.ts` — assert DB write is called with correct fields.

### Integration Tests
- **Location:** `tests/integration/`
- **Tool:** `supertest` against the Express app instance from `src/app.ts`.
- **Database:** Use a dedicated test PostgreSQL database (`DATABASE_URL_TEST`). Run `prisma migrate deploy` in `globalSetup.ts`.
- **Isolation:** Wrap each test in a transaction that is rolled back after the test, or truncate tables in `afterEach`.
- **Required scenarios for `users.api.test.ts`:**
  - `POST /users` — 201 on valid payload.
  - `POST /users` — 409 on duplicate email.
  - `POST /users` — 422 on missing required fields.
  - `POST /users` — 422 on invalid email format.
  - `POST /users` — 422 on weak password.
  - `POST /users` — 429 on rate limit breach.
  - Verify password is NOT returned in response body.
  - Verify notification event is published to queue.

### Running Tests
```bash
npm test                          # run all tests
npm run test:unit                 # unit only
npm run test:integration          # integration only
npm run test:coverage             # with coverage report
```

Add to `package.json` scripts:
```json
{
  "test": "jest",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration",
  "test:coverage": "jest --coverage",
  "lint": "eslint 'src/**/*.ts' 'tests/**/*.ts'",
  "type-check": "tsc --noEmit",
  "build": "tsc -p tsconfig.json",
  "dev": "ts-node-dev --respawn src/main.ts",
  "start": "node dist/main.js"
}
```

---

## 6. Docker & CI

### `Dockerfile` (multi-stage)
```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build
RUN npx prisma generate

# ── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node