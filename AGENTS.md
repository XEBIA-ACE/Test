# AGENTS.md — User Management Service

## 1. Stack

| Technology | Role |
|---|---|
| **Node.js 20 LTS** | Runtime for Express API gateway / BFF layer |
| **Express.js 4.x** | HTTP routing, middleware pipeline, request validation |
| **Java 21 (LTS)** | Core business logic runtime (Spring Boot 3.x) |
| **Spring Boot 3.x** | Application framework, auto-configuration, embedded Tomcat |
| **Spring Security 6.x** | Authentication filters, authorization rules, security context |
| **Spring Data JPA** | ORM layer for user profile persistence |
| **JWT (jjwt 0.12.x)** | Token generation, signing (RS256), validation, refresh logic |
| **PostgreSQL 15** | Primary relational store for user profiles and sessions |
| **Redis 7** | Session cache, token blacklist, rate-limit counters |
| **Flyway** | Database schema migrations (Java service) |
| **Jest 29** | Unit and integration testing (Node.js layer) |
| **JUnit 5 + Mockito** | Unit and integration testing (Java layer) |
| **Testcontainers** | Ephemeral PostgreSQL/Redis for Java integration tests |
| **Docker / Docker Compose** | Containerisation and local orchestration |
| **GitHub Actions** | CI pipeline |

---

## 2. Project Structure

```
user-management-service/
│
├── AGENTS.md                        # This file
├── tasks.md                         # Agent-generated task tracker (created before coding)
├── docker-compose.yml               # Local orchestration (app + postgres + redis)
├── .env.example                     # All required env vars with placeholder values
├── .gitignore
├── README.md
│
├── gateway/                         # Node.js / Express layer (API Gateway / BFF)
│   ├── package.json
│   ├── package-lock.json
│   ├── jest.config.js               # Jest configuration
│   ├── tsconfig.json                # TypeScript config (strict mode)
│   ├── .eslintrc.json
│   ├── .prettierrc
│   │
│   ├── src/
│   │   ├── app.ts                   # Express app factory (no listen call)
│   │   ├── server.ts                # Entry point — calls app.listen
│   │   ├── config/
│   │   │   ├── env.ts               # Validated env var loader (zod schema)
│   │   │   └── logger.ts            # Pino logger instance
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts      # Global Express error handler
│   │   │   ├── requestLogger.ts     # HTTP request logging middleware
│   │   │   ├── rateLimiter.ts       # Redis-backed rate limiting
│   │   │   └── validateJwt.ts       # JWT verification middleware (calls Java service)
│   │   ├── routes/
│   │   │   ├── index.ts             # Route aggregator
│   │   │   ├── auth.routes.ts       # POST /auth/login, /auth/logout, /auth/refresh
│   │   │   └── users.routes.ts      # CRUD /users, /users/:id
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── javaClient.service.ts # Axios client to Spring Boot service
│   │   └── types/
│   │       └── index.d.ts           # Shared TypeScript interfaces
│   │
│   └── tests/
│       ├── unit/
│       │   ├── middleware/
│       │   └── controllers/
│       └── integration/
│           └── routes/              # Supertest route integration tests
│
├── core/                            # Java / Spring Boot layer (business + security)
│   ├── pom.xml                      # Maven build descriptor
│   ├── Dockerfile                   # Java service container
│   │
│   └── src/
│       ├── main/
│       │   ├── java/com/company/usermanagement/
│       │   │   ├── UserManagementApplication.java   # @SpringBootApplication entry
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java           # Spring Security filter chain
│       │   │   │   ├── JwtConfig.java                # RSA key pair beans
│       │   │   │   └── RedisConfig.java              # Lettuce connection factory
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   └── UserController.java
│       │   │   ├── service/
│       │   │   │   ├── AuthService.java
│       │   │   │   ├── UserService.java
│       │   │   │   └── TokenService.java             # JWT issue / validate / revoke
│       │   │   ├── repository/
│       │   │   │   ├── UserRepository.java           # JpaRepository<User, UUID>
│       │   │   │   └── SessionRepository.java        # Redis hash operations
│       │   │   ├── domain/
│       │   │   │   ├── User.java                     # @Entity with Hibernate validation
│       │   │   │   └── Session.java                  # Redis-backed session POJO
│       │   │   ├── dto/
│       │   │   │   ├── request/
│       │   │   │   │   ├── LoginRequest.java
│       │   │   │   │   ├── RegisterRequest.java
│       │   │   │   │   └── UpdateUserRequest.java
│       │   │   │   └── response/
│       │   │   │       ├── AuthResponse.java
│       │   │   │       └── UserResponse.java
│       │   │   ├── security/
│       │   │   │   ├── JwtAuthFilter.java            # OncePerRequestFilter JWT extraction
│       │   │   │   ├── UserDetailsServiceImpl.java
│       │   │   │   └── SecurityContextHelper.java
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java   # @RestControllerAdvice
│       │   │       ├── UserNotFoundException.java
│       │   │       └── TokenValidationException.java
│       │   │
│       │   └── resources/
│       │       ├── application.yml                   # Base config (references env vars)
│       │       ├── application-local.yml             # Local dev overrides
│       │       └── db/migration/                     # Flyway SQL scripts
│       │           ├── V1__create_users_table.sql
│       │           └── V2__create_sessions_index.sql
│       │
│       └── test/
│           └── java/com/company/usermanagement/
│               ├── unit/
│               │   ├── service/
│               │   │   ├── AuthServiceTest.java
│               │   │   ├── UserServiceTest.java
│               │   │   └── TokenServiceTest.java
│               │   └── security/
│               │       └── JwtAuthFilterTest.java
│               └── integration/
│                   ├── controller/
│                   │   ├── AuthControllerIT.java
│                   │   └── UserControllerIT.java
│                   └── AbstractIntegrationTest.java  # Testcontainers base class
│
└── .github/
    └── workflows/
        └── ci.yml                   # GitHub Actions pipeline
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

### Step 1 — Read Specifications
- Parse all story/feature spec files provided in the prompt context.
- Identify every endpoint, data model, security rule, and acceptance criterion.
- List any ambiguities; do not invent behaviour that is not specified.

### Step 2 — Create `tasks.md`
- Before writing any source code, create `tasks.md` at the repository root.
- Structure it as a checklist grouped by: **Setup → Domain/DB → Security → Services → Controllers → Routes → Tests → Docker → CI**.
- Each task must be a single, verifiable action (e.g., "Create `User.java` entity with UUID primary key and `@CreatedDate` auditing").
- Check off tasks (`- [x]`) as they are completed.

### Step 3 — Implement (follow task order)
1. Scaffold Maven `pom.xml` and Node.js `package.json` with all declared dependencies.
2. Configure environment variables — add every variable to `.env.example` before using it in code.
3. Implement domain entities and Flyway migrations first.
4. Implement repositories, then services, then controllers, then routes.
5. Wire Spring Security filter chain (`SecurityConfig.java`) before implementing protected endpoints.
6. Implement `TokenService` (issue, validate, revoke via Redis blacklist) before any auth endpoint.
7. Implement the Node.js gateway last — it depends on the Java service contract being stable.

### Step 4 — Test
- Write tests alongside each implementation file, not after all files are complete.
- Every public method in a service class must have at least one unit test before moving to the next class.
- Run tests locally (see §5) and confirm all pass before proceeding.

### Step 5 — Validate
- Run `npm run lint` and `mvn checkstyle:check` — zero warnings permitted.
- Run `docker compose up --build` and confirm all containers reach healthy status.
- Confirm coverage thresholds are met (see §5).
- Update `tasks.md` — all items must be checked before marking the service complete.

---

## 4. Coding Conventions

### General
- All secrets and environment-specific values **must** come from environment variables — never hardcoded.
- Every public API must return consistent JSON error envelopes: `{ "status": <int>, "error": "<string>", "message": "<string>", "timestamp": "<ISO8601>" }`.

### Node.js / Express (TypeScript)
- **Language:** TypeScript 5.x, `strict: true`, `noImplicitAny: true`.
- **File naming:** `kebab-case.ts` for all files; exported classes use `PascalCase`.
- **Function style:** Prefer `async/await`; never use raw `.then()` chains in route handlers.
- **Controllers** must be thin — delegate all logic to a service or the Java client; no business logic in controllers.
- **Middleware** must call `next(error)` on failure — never swallow errors silently.
- **Imports:** Use absolute paths via `tsconfig` path aliases (`@/config`, `@/middleware`, etc.).
- **Linting:** ESLint with `@typescript-eslint/recommended` + `plugin:import/recommended`; Prettier for formatting.
- **Logging:** Use Pino — structured JSON logs; never use `console.log` in production code.

### Java / Spring Boot
- **Package naming:** `com.company.usermanagement.<layer>` — never mix layers in one package.
- **Class naming:** `PascalCase`; method naming: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- **DTOs:** Use `record` types for immutable request/response objects (Java 16+).
- **Entities:** Annotate with `@Entity`, `@Table(name = "...")` explicitly; use `UUID` primary keys generated with `@UuidGenerator`.
- **Services:** Annotated with `@Service @Transactional`; read-only methods use `@Transactional(readOnly = true)`.
- **No field injection:** Use constructor injection exclusively (`@RequiredArgsConstructor` via Lombok is acceptable).
- **Exception handling:** All exceptions bubble to `GlobalExceptionHandler`; never return error details from individual controllers.
- **Validation:** Use `@Valid` on all controller method parameters; define constraints on DTO fields with Jakarta Validation annotations.
- **Security:** Passwords hashed with `BCryptPasswordEncoder` (strength 12); tokens signed with RS256 (2048-bit RSA key pair loaded from env).
- **Checkstyle:** Google Java Style Guide; enforced via Maven Checkstyle plugin.

### JWT Conventions
- Access token TTL: 15 minutes; Refresh token TTL: 7 days.
- Store refresh tokens in Redis with key pattern `refresh:<userId>:<jti>`.
- Revoked tokens tracked in Redis blacklist with key pattern `blacklist:<jti>`, TTL = remaining token lifetime.
- Claims must include: `sub` (userId), `email`, `roles`, `iat`, `exp`, `jti`.

---

## 5. Testing

### Node.js (Jest)

```bash
# Run all tests
cd gateway && npm test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

**`jest.config.js` requirements:**
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 90, statements: 90 }
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/types/**']
};
```

**Test patterns:**
- Unit tests: mock all external dependencies (Axios calls, Redis) with `jest.mock()`.
- Integration tests: use `supertest` against the Express app instance; mock the Java client service.
- Test files colocated under `tests/unit/` and `tests/integration/` mirroring `src/` structure.
- Each test file must import only from the module under test — no cross-module shortcuts.

### Java (JUnit 5 + Mockito)

```bash
# Run unit tests only
cd core && mvn test -Dtest="**/unit/**"

# Run all tests including integration (requires Docker)
mvn verify

# Generate coverage report (JaCoCo)
mvn verify jacoco:report
# Report at: core/target/site/jacoco/index.html
```

**Maven Surefire / Failsafe configuration (in `pom.xml`):**
```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <configuration>
    <rules>
      <rule>
        <limits>
          <limit>
            <counter>LINE</counter>
            <minimum>0.90</minimum>
          </limit>
          <limit>
            <counter>BRANCH</counter>
            <minimum>0.90</minimum>
          </limit>
        </limits>
      </rule>
    </rules>
  </configuration>
</plugin>
```

**Test patterns:**
- Unit tests (`*Test.java`): annotate with `@ExtendWith(MockitoExtension.class)`; mock all repository and external dependencies.
- Integration tests (`*IT.java`): extend `AbstractIntegrationTest` which starts PostgreSQL and Redis via Testcontainers; use `@SpringBootTest(webEnvironment = RANDOM_PORT)`.
- `TokenService` must have dedicated tests for: issue, validate (valid), validate (expired), validate (blacklisted), revoke.
- `AuthService` must have dedicated tests for: successful login, wrong password, unknown user, locked account.

---

## 6. Docker & CI

### Dockerfile — Java Core Service (`core/Dockerfile`)

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget