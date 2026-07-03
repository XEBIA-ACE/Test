# AGENTS.md — ProjectManagementService

> **AI Agent Scaffold Specification**
> Service: `ProjectManagementService` | Stack: Spring Boot · REST API · PostgreSQL

---

## 1. Stack

| Technology | Version (minimum) | Role |
|---|---|---|
| Java | 21 (LTS) | Primary language |
| Spring Boot | 3.3.x | Application framework, auto-configuration |
| Spring Web (MVC) | via Boot | REST API layer |
| Spring Data JPA | via Boot | ORM / repository abstraction |
| Spring Validation | via Boot | Bean Validation (JSR-380) |
| Spring Security | 6.x | Authentication, authorisation, secure defaults |
| PostgreSQL | 16.x | Primary relational datastore |
| Flyway | 10.x | Database schema versioning and migrations |
| Hibernate | 6.x | JPA provider |
| MapStruct | 1.6.x | DTO ↔ Entity mapping (compile-time, no reflection) |
| Lombok | 1.18.x | Boilerplate reduction (`@Builder`, `@Data`, etc.) |
| OpenFeign (Spring Cloud) | 4.x | Declarative HTTP client for external calendar & reporting services |
| Resilience4j | 2.x | Circuit breaker / retry for external service calls |
| SpringDoc OpenAPI | 2.x | Auto-generated OpenAPI 3 documentation (`/swagger-ui.html`) |
| JUnit 5 | via Boot | Unit and integration test framework |
| Mockito | via Boot | Mocking in unit tests |
| Testcontainers | 1.19.x | PostgreSQL container for integration tests |
| AssertJ | via Boot | Fluent assertions |
| JaCoCo | 0.8.x | Code coverage enforcement |
| Maven | 3.9.x | Build tool |
| Docker / Compose | 25.x / 2.x | Containerisation and local orchestration |
| GitHub Actions | — | CI pipeline |

---

## 2. Project Structure

Create the following layout exactly. Do not deviate from this structure.

```
project-management-service/
├── .github/
│   └── workflows/
│       └── ci.yml                         # GitHub Actions CI pipeline
├── docker/
│   └── init/
│       └── .gitkeep                       # Placeholder for DB init scripts if needed
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/projectmanagement/
│   │   │       ├── ProjectManagementApplication.java        # Spring Boot entry point
│   │   │       ├── config/
│   │   │       │   ├── SecurityConfig.java                  # Spring Security configuration
│   │   │       │   ├── FeignConfig.java                     # Feign client global config (auth headers, logging)
│   │   │       │   ├── Resilience4jConfig.java              # Circuit breaker / retry beans
│   │   │       │   └── OpenApiConfig.java                   # SpringDoc customisation
│   │   │       ├── controller/
│   │   │       │   ├── ProjectController.java               # REST endpoints for project lifecycle
│   │   │       │   └── advice/
│   │   │       │       └── GlobalExceptionHandler.java      # @RestControllerAdvice — maps exceptions to RFC 7807 ProblemDetail
│   │   │       ├── service/
│   │   │       │   ├── ProjectService.java                  # Interface — business operations contract
│   │   │       │   └── impl/
│   │   │       │       └── ProjectServiceImpl.java          # Implementation — orchestration logic
│   │   │       ├── domain/
│   │   │       │   ├── entity/
│   │   │       │   │   └── Project.java                     # JPA entity
│   │   │       │   └── enums/
│   │   │       │       └── ProjectStatus.java               # Lifecycle status enum (DRAFT, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED)
│   │   │       ├── repository/
│   │   │       │   └── ProjectRepository.java               # Spring Data JPA repository interface
│   │   │       ├── dto/
│   │   │       │   ├── request/
│   │   │       │   │   ├── CreateProjectRequest.java        # Validated inbound payload for creation
│   │   │       │   │   └── UpdateProjectRequest.java        # Validated inbound payload for updates
│   │   │       │   └── response/
│   │   │       │       └── ProjectResponse.java             # Outbound payload (never expose entities directly)
│   │   │       ├── mapper/
│   │   │       │   └── ProjectMapper.java                   # MapStruct interface — entity ↔ DTO conversions
│   │   │       ├── client/
│   │   │       │   ├── CalendarServiceClient.java           # Feign client — external calendar service
│   │   │       │   ├── ReportingServiceClient.java          # Feign client — external reporting service
│   │   │       │   └── dto/
│   │   │       │       ├── CalendarEventRequest.java        # Outbound payload to calendar service
│   │   │       │       └── ReportingEventRequest.java       # Outbound payload to reporting service
│   │   │       └── exception/
│   │   │           ├── ProjectNotFoundException.java        # 404 — project does not exist
│   │   │           ├── ProjectValidationException.java      # 422 — business rule violation
│   │   │           └── ExternalServiceException.java        # 502 — upstream call failure
│   │   └── resources/
│   │       ├── application.yml                              # Base configuration (profiles: dev, prod)
│   │       ├── application-dev.yml                         # Dev overrides (local DB, debug logging)
│   │       ├── application-prod.yml                        # Prod overrides (env var references only)
│   │       └── db/
│   │           └── migration/
│   │               └── V1__create_projects_table.sql        # Flyway baseline migration
│   └── test/
│       └── java/
│           └── com/company/projectmanagement/
│               ├── controller/
│               │   └── ProjectControllerTest.java           # @WebMvcTest slice — controller unit tests
│               ├── service/
│               │   └── ProjectServiceImplTest.java          # Pure unit tests with Mockito
│               ├── repository/
│               │   └── ProjectRepositoryTest.java           # @DataJpaTest slice — query correctness
│               ├── client/
│               │   └── CalendarServiceClientTest.java       # Feign client tests (WireMock or MockServer)
│               └── integration/
│                   └── ProjectIntegrationTest.java          # @SpringBootTest + Testcontainers full-stack test
├── Dockerfile                                               # Multi-stage production image
├── docker-compose.yml                                       # Local dev orchestration (app + postgres)
├── docker-compose.test.yml                                  # Integration test orchestration
├── pom.xml                                                  # Maven build descriptor
├── .gitignore
├── .editorconfig                                            # Consistent editor formatting
├── checkstyle.xml                                           # Checkstyle ruleset
└── AGENTS.md                                                # This file
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

```
STEP 1 — READ SPECIFICATIONS
  - Read all story/spec files provided in the prompt context.
  - Identify all entities, endpoints, business rules, and external integrations.
  - Note any security, validation, or data-retention requirements explicitly.

STEP 2 — CREATE tasks.md
  - Create a file named `tasks.md` at the project root before writing any code.
  - Break the implementation into atomic, numbered tasks (e.g., T-01, T-02 …).
  - Each task must state: what to create, which file(s) to modify, and its acceptance criterion.
  - Mark each task [ ] (incomplete) initially.

STEP 3 — SCAFFOLD STRUCTURE
  - Create every directory and placeholder file listed in Section 2.
  - Generate pom.xml with all dependencies from Section 1 at the correct versions.
  - Write application.yml, application-dev.yml, application-prod.yml skeletons.
  - Write the initial Flyway migration SQL for the projects table.

STEP 4 — IMPLEMENT DOMAIN & PERSISTENCE
  - Implement the Project JPA entity and ProjectStatus enum.
  - Implement ProjectRepository with any required custom @Query methods.
  - Validate the entity compiles and Flyway migration runs cleanly.

STEP 5 — IMPLEMENT SERVICE LAYER
  - Define the ProjectService interface with all required method signatures.
  - Implement ProjectServiceImpl with full business logic.
  - Integrate Feign clients (CalendarServiceClient, ReportingServiceClient) with Resilience4j decorators.

STEP 6 — IMPLEMENT API LAYER
  - Implement ProjectController with all REST endpoints.
  - Implement GlobalExceptionHandler mapping every custom exception to ProblemDetail (RFC 7807).
  - Annotate all request DTOs with Bean Validation constraints.

STEP 7 — WRITE TESTS
  - Write tests for every class before marking tasks complete (test-alongside, not after).
  - Achieve ≥ 90% line and branch coverage as enforced by JaCoCo (see Section 5).

STEP 8 — DOCKER & CI
  - Write the Dockerfile (multi-stage).
  - Write docker-compose.yml and docker-compose.test.yml.
  - Write .github/workflows/ci.yml.

STEP 9 — VALIDATE
  - Run: mvn clean verify
  - Confirm: zero compilation errors, zero test failures, JaCoCo coverage gate passes.
  - Confirm: docker build completes successfully.
  - Update tasks.md — mark every completed task [x].

STEP 10 — SELF-REVIEW
  - Re-read every file against the constraints in Section 7.
  - Fix any violation before declaring the scaffold complete.
```

---

## 4. Coding Conventions

### 4.1 Naming

| Artifact | Convention | Example |
|---|---|---|
| Package | `com.company.projectmanagement.<layer>` | `com.company.projectmanagement.service` |
| Class | `PascalCase` | `ProjectServiceImpl` |
| Method | `camelCase`, verb-first | `createProject`, `findProjectById` |
| Variable | `camelCase` | `projectRepository` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_PROJECT_NAME_LENGTH` |
| REST endpoint | `kebab-case` nouns, plural | `/api/v1/projects` |
| DB table | `snake_case`, plural | `projects`, `project_members` |
| DB column | `snake_case` | `created_at`, `project_status` |
| Flyway migration | `V{n}__{description}.sql` | `V2__add_project_owner_column.sql` |
| DTO | Suffix `Request` / `Response` | `CreateProjectRequest`, `ProjectResponse` |
| Exception | Suffix `Exception` | `ProjectNotFoundException` |

### 4.2 Architecture Patterns

- **Strict layering**: Controller → Service → Repository. Controllers must not call repositories directly.
- **Interface-backed services**: Every service class must implement an interface. Inject the interface, not the implementation.
- **DTO boundary**: Entities must never be serialised to the HTTP response. Always map via MapStruct to a response DTO.
- **Immutable DTOs**: Declare request/response DTOs as Java records or use `@Value` + `@Builder` from Lombok.
- **Transaction management**: Place `@Transactional` on service methods, not on controllers or repositories.
- **Read-only transactions**: Annotate read-only service methods with `@Transactional(readOnly = true)`.
- **Pagination**: All list endpoints must accept `Pageable` and return `Page<ProjectResponse>`.

### 4.3 Spring Boot Specifics

- Use constructor injection everywhere. **No field injection (`@Autowired` on fields).**
- Externalise all configuration to `application.yml`; use `@ConfigurationProperties` beans for typed config.
- Use `@Validated` on `@ConfigurationProperties` classes to fail fast on misconfiguration at startup.
- Never hard-code credentials, URLs, or secrets. Reference environment variables via `${ENV_VAR_NAME}`.
- Use Spring profiles (`dev`, `prod`) — never commit prod secrets.
- Actuator endpoints (`/actuator/health`, `/actuator/info`) must be enabled and secured appropriately.

### 4.4 REST API Style

- All endpoints prefixed `/api/v1/`.
- HTTP semantics: `POST` → 201 Created, `GET` → 200 OK, `PUT`/`PATCH` → 200 OK, `DELETE` → 204 No Content.
- Error responses must conform to **RFC 7807 ProblemDetail** (`application/problem+json`).
- Validation errors must return 422 Unprocessable Entity with field-level detail.
- Use `ResponseEntity<T>` return types in controllers for explicit status control.

### 4.5 Security

- Enable CSRF protection unless the API is stateless JWT-only (document the choice explicitly).
- Sanitise all user input; rely on Bean Validation constraints as the first line of defence.
- Use parameterised queries only (Spring Data JPA / JPQL). **No string-concatenated queries.**
- Sensitive fields (e.g., owner email) must not appear in logs. Use `@JsonIgnore` or log masking.

### 4.6 External Service Integration

- All Feign clients must declare a `fallback` or be wrapped with a Resilience4j `@CircuitBreaker`.
- Set explicit `connectTimeout` and `readTimeout` for every Feign client in `application.yml`.
- Log external call failures at `WARN` level with correlation IDs; do not swallow exceptions silently.

### 4.7 Code Style

- Enforce Checkstyle rules via `checkstyle.xml` (Google Java Style as baseline).
- Maximum method length: 30 lines. Extract helpers aggressively.
- Maximum class length: 300 lines.
- All public methods and classes must have Javadoc.
- No `System.out.println` — use SLF4J (`private static final Logger log = LoggerFactory.getLogger(...)` or Lombok `@Slf4j`).

---

## 5. Testing

### 5.1 Coverage Requirement

**Minimum 90% line coverage AND 90% branch coverage**, enforced by JaCoCo as a Maven build-break gate.

Add to `pom.xml`:

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.12</version>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <phase>verify</phase>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.90</minimum>
              </limit>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.90</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
        <excludes>
          <exclude>com/company/projectmanagement/ProjectManagementApplication.class</exclude>
          <exclude>com/company/projectmanagement/dto/**</exclude>
          <exclude>com/company/projectmanagement/domain/enums/**</exclude>
        </excludes>
      </configuration>
    </execution>
  </executions>
</plugin>