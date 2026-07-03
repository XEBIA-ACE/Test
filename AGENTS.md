# AGENTS.md — Project Creation Service

## 1. Stack

| Technology | Role |
|---|---|
| Java 21 (LTS) | Primary language |
| Spring Boot 3.x | Application framework (web, validation, data) |
| Spring Web MVC | REST API layer |
| Spring Data JPA | ORM and repository abstraction |
| Spring Validation (Jakarta) | Request/payload validation |
| Spring Events / Spring Kafka (choose one) | Internal and outbound event processing |
| PostgreSQL 15+ | Primary relational data store |
| Flyway | Database schema migrations |
| HikariCP | JDBC connection pooling (bundled with Spring Boot) |
| MapStruct | DTO ↔ Entity mapping |
| Lombok | Boilerplate reduction (getters, builders, etc.) |
| JUnit 5 | Unit and integration test framework |
| Mockito | Mocking for unit tests |
| Testcontainers | Ephemeral PostgreSQL for integration tests |
| AssertJ | Fluent test assertions |
| JaCoCo | Code coverage enforcement |
| Maven Wrapper (`mvnw`) | Reproducible builds |
| Docker + Docker Compose | Containerisation and local dev environment |
| GitHub Actions | CI pipeline |

---

## 2. Project Structure

```
project-creation-service/
├── .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI pipeline
├── docker/
│   └── postgres/
│       └── init.sql                      # Optional seed/init SQL (non-migration)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/projectcreation/
│   │   │       ├── ProjectCreationApplication.java   # Spring Boot entry point
│   │   │       ├── api/
│   │   │       │   ├── controller/
│   │   │       │   │   └── ProjectController.java    # REST endpoints
│   │   │       │   ├── dto/
│   │   │       │   │   ├── CreateProjectRequest.java # Inbound DTO (validated)
│   │   │       │   │   └── ProjectResponse.java      # Outbound DTO
│   │   │       │   └── mapper/
│   │   │       │       └── ProjectMapper.java        # MapStruct interface
│   │   │       ├── domain/
│   │   │       │   ├── model/
│   │   │       │   │   └── Project.java              # JPA entity
│   │   │       │   ├── repository/
│   │   │       │   │   └── ProjectRepository.java    # Spring Data JPA repo
│   │   │       │   └── service/
│   │   │       │       └── ProjectService.java       # Core business logic
│   │   │       ├── event/
│   │   │       │   ├── ProjectCreatedEvent.java      # Domain event record/class
│   │   │       │   └── ProjectEventPublisher.java    # Publishes events (Spring/Kafka)
│   │   │       ├── exception/
│   │   │       │   ├── ProjectNotFoundException.java
│   │   │       │   ├── ProjectValidationException.java
│   │   │       │   └── GlobalExceptionHandler.java   # @RestControllerAdvice
│   │   │       └── config/
│   │   │           ├── DatabaseConfig.java           # DataSource / JPA tuning
│   │   │           └── EventConfig.java              # Event broker config bean
│   │   └── resources/
│   │       ├── application.yml                       # Base configuration
│   │       ├── application-local.yml                 # Local dev overrides
│   │       ├── application-test.yml                  # Test profile config
│   │       └── db/
│   │           └── migration/
│   │               └── V1__create_projects_table.sql # Flyway baseline migration
│   └── test/
│       ├── java/
│       │   └── com/example/projectcreation/
│       │       ├── api/
│       │       │   └── controller/
│       │       │       └── ProjectControllerTest.java        # MockMvc unit tests
│       │       ├── domain/
│       │       │   └── service/
│       │       │       └── ProjectServiceTest.java           # Unit tests (Mockito)
│       │       ├── event/
│       │       │   └── ProjectEventPublisherTest.java        # Event publishing unit tests
│       │       └── integration/
│       │           └── ProjectCreationIntegrationTest.java   # Testcontainers full-stack
│       └── resources/
│           └── application-test.yml                  # Test datasource (Testcontainers)
├── Dockerfile                            # Production image definition
├── docker-compose.yml                    # Local dev: app + postgres
├── docker-compose.test.yml               # Integration test environment
├── pom.xml                               # Maven build descriptor
├── mvnw / mvnw.cmd                       # Maven wrapper scripts
├── .mvn/
│   └── wrapper/
│       └── maven-wrapper.properties
├── tasks.md                              # Agent-generated task tracker (see §3)
├── .gitignore
└── README.md
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

### Step 1 — Read All Specifications
- Read every spec file provided (user stories, domain model, API contracts, event schemas).
- Identify: entities, validation rules, event triggers, error scenarios, and acceptance criteria.
- Do not write any code yet.

### Step 2 — Create `tasks.md`
Create `tasks.md` at the project root before writing any implementation code. Format:

```markdown
# tasks.md

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete

## Tasks
- [ ] TASK-001: Scaffold Maven project structure and pom.xml
- [ ] TASK-002: Configure application.yml (base, local, test profiles)
- [ ] TASK-003: Write Flyway migration V1__create_projects_table.sql
- [ ] TASK-004: Implement Project JPA entity
- [ ] TASK-005: Implement ProjectRepository
- [ ] TASK-006: Implement CreateProjectRequest DTO with Jakarta validation annotations
- [ ] TASK-007: Implement ProjectResponse DTO
- [ ] TASK-008: Implement ProjectMapper (MapStruct)
- [ ] TASK-009: Implement ProjectService (validate → persist → publish)
- [ ] TASK-010: Implement ProjectCreatedEvent
- [ ] TASK-011: Implement ProjectEventPublisher
- [ ] TASK-012: Implement ProjectController (POST /api/v1/projects)
- [ ] TASK-013: Implement GlobalExceptionHandler
- [ ] TASK-014: Write unit tests — ProjectServiceTest
- [ ] TASK-015: Write unit tests — ProjectControllerTest
- [ ] TASK-016: Write unit tests — ProjectEventPublisherTest
- [ ] TASK-017: Write integration test — ProjectCreationIntegrationTest
- [ ] TASK-018: Verify JaCoCo coverage ≥ 90%
- [ ] TASK-019: Write Dockerfile
- [ ] TASK-020: Write docker-compose.yml and docker-compose.test.yml
- [ ] TASK-021: Write GitHub Actions ci.yml
- [ ] TASK-022: Final build validation (`./mvnw verify`)
```

Update each task status as work progresses.

### Step 3 — Implement
- Implement tasks in the order listed in `tasks.md`.
- Mark each task `[~]` when started, `[x]` when complete.
- Commit logical units: one task or closely related tasks per commit.
- Follow all conventions in §4.

### Step 4 — Test
- Write tests before marking an implementation task complete.
- Run unit tests after each service/controller is implemented: `./mvnw test`.
- Run integration tests with: `./mvnw verify -Pfailsafe` (or equivalent Testcontainers profile).
- Do not proceed to §5 until all tests pass.

### Step 5 — Validate
- Run `./mvnw verify` (compiles, tests, JaCoCo report).
- Confirm JaCoCo line and branch coverage ≥ 90% for `com.example.projectcreation` packages.
- Run `docker compose up --build` and confirm the service starts and responds to `GET /actuator/health`.
- Mark all tasks `[x]` in `tasks.md`.

---

## 4. Coding Conventions

### Naming
| Artifact | Convention | Example |
|---|---|---|
| Packages | `lowercase.dot.separated` | `com.example.projectcreation.domain.service` |
| Classes | `PascalCase` | `ProjectService` |
| Methods / variables | `camelCase` | `createProject()`, `projectId` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_NAME_LENGTH` |
| Database tables | `snake_case` | `projects`, `project_tags` |
| Database columns | `snake_case` | `created_at`, `owner_id` |
| REST endpoints | `kebab-case` nouns, versioned | `/api/v1/projects` |
| Flyway migrations | `V{n}__{description}.sql` | `V1__create_projects_table.sql` |
| DTOs | Suffix `Request` / `Response` | `CreateProjectRequest`, `ProjectResponse` |
| Events | Suffix `Event` | `ProjectCreatedEvent` |

### Architecture Rules
- **Layered architecture**: `api` → `domain` → `repository`. No layer may import from a layer above it.
- **DTOs never enter the domain layer.** `ProjectService` accepts and returns domain objects or primitives only. Mapping happens in the controller or a dedicated mapper.
- **Entities are never serialised directly** to HTTP responses. Always map to a response DTO.
- `ProjectService` is the single orchestration point: validate → persist → publish event.
- `ProjectEventPublisher` is injected into `ProjectService`; it must be behind an interface to allow mocking.
- Use `@Transactional` on service methods that write to the database. Event publishing must occur **after** the transaction commits (use `@TransactionalEventListener(phase = AFTER_COMMIT)` or equivalent).

### Spring Boot Specifics
- Use constructor injection everywhere. No `@Autowired` on fields.
- Annotate the entry point with `@SpringBootApplication` only; do not add `@ComponentScan` unless strictly necessary.
- Use `@RestController` + `@RequestMapping` on controllers; never `@Controller` for REST endpoints.
- Use `@Valid` on `@RequestBody` parameters to trigger Jakarta validation.
- Return `ResponseEntity<ProjectResponse>` from controller methods with explicit HTTP status codes.
- Use `@Value` or `@ConfigurationProperties` (preferred) for externalised config — never hardcode values.

### Lombok
- Use `@Builder`, `@Getter`, `@Setter` explicitly — avoid `@Data` on JPA entities (breaks `equals`/`hashCode`).
- On JPA entities use `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` with `@EqualsAndHashCode.Include` on the primary key.

### Validation
- All validation annotations go on `CreateProjectRequest` fields (e.g., `@NotBlank`, `@Size`, `@NotNull`).
- Business-rule validation (e.g., duplicate project name) lives in `ProjectService` and throws `ProjectValidationException`.
- `GlobalExceptionHandler` maps exceptions to structured `ProblemDetail` (RFC 7807) responses.

---

## 5. Testing

### Test Categories

| Category | Location | Tools | Scope |
|---|---|---|---|
| Unit | `src/test/.../domain/service/` | JUnit 5, Mockito, AssertJ | Service logic, pure functions |
| Unit | `src/test/.../api/controller/` | JUnit 5, MockMvc, Mockito | HTTP layer, validation, status codes |
| Unit | `src/test/.../event/` | JUnit 5, Mockito | Event publishing logic |
| Integration | `src/test/.../integration/` | Testcontainers, Spring Boot Test | Full stack with real PostgreSQL |

### Unit Test Standards
```java
// Naming: methodName_stateUnderTest_expectedBehaviour
@Test
void createProject_whenNameIsBlank_throwsProjectValidationException() { ... }

// Structure: Arrange / Act / Assert (AAA) — always use comments
@Test
void createProject_withValidData_persistsAndPublishesEvent() {
    // Arrange
    var request = ...;
    when(projectRepository.save(any())).thenReturn(savedProject);

    // Act
    var result = projectService.createProject(request);

    // Assert
    assertThat(result.getId()).isNotNull();
    verify(eventPublisher).publish(any(ProjectCreatedEvent.class));
}
```

### Integration Test Standards
```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class ProjectCreationIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    // Tests use TestRestTemplate or MockMvc via @AutoConfigureMockMvc
}
```

### Coverage Enforcement
Add to `pom.xml` under the JaCoCo plugin:
```xml
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
</configuration>
```

Exclude generated MapStruct classes and Lombok-generated code from coverage:
```xml
<excludes>
  <exclude>**/mapper/**MapperImpl.class</exclude>
  <exclude>**/*Application.class</exclude>
</excludes>
```

### Running Tests
```bash
# Unit tests only
./mvnw test

# All tests including integration (Testcontainers requires Docker)
./mvnw verify

# Coverage report (generated at target/site/jacoco/index.html)
./mvnw verify && open target/site/jacoco/index.html
```

---

## 6. Docker & CI

### Dockerfile
Use a two-stage build to keep the production image minimal:

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q
COPY src/ src/
RUN ./mvnw package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

### docker-compose.yml (local dev)
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: projectcreation
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432