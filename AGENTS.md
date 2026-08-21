# AGENTS.md — ProductCatalogService

> **AI Agent Scaffold Specification**
> Service: `ProductCatalogService` | Stack: Java · Spring Boot · Elasticsearch

---

## 1. Stack

| Technology | Version (minimum) | Role |
|---|---|---|
| Java | 21 (LTS) | Primary language |
| Spring Boot | 3.3.x | Application framework, DI, auto-configuration |
| Spring Data Elasticsearch | 5.3.x | Elasticsearch repository abstraction and client |
| Elasticsearch | 8.x | Primary data store for product documents |
| Elasticsearch Java Client | 8.x | Low-level and high-level REST client |
| Gradle (Kotlin DSL) | 8.x | Build tool and dependency management |
| JUnit 5 | 5.10.x | Unit and integration test framework |
| Mockito | 5.x | Mocking framework for unit tests |
| Testcontainers | 1.19.x | Elasticsearch container for integration tests |
| MapStruct | 1.5.x | DTO ↔ document mapping |
| Lombok | 1.18.x | Boilerplate reduction (getters, builders, etc.) |
| Springdoc OpenAPI | 2.x | Auto-generated API documentation (Swagger UI) |
| Micrometer + Prometheus | 1.13.x | Metrics and observability |
| Checkstyle + SpotBugs | latest | Static analysis and code quality gates |
| Docker / Docker Compose | 24.x / 2.x | Containerisation and local dev orchestration |

---

## 2. Project Structure

```
product-catalog-service/
├── AGENTS.md                          # This file
├── tasks.md                           # Agent-generated task tracker (created before coding)
├── build.gradle.kts                   # Gradle build script (Kotlin DSL)
├── settings.gradle.kts                # Project name and module declarations
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── config/
│   ├── checkstyle/
│   │   └── checkstyle.xml             # Checkstyle ruleset (Google Java Style)
│   └── spotbugs/
│       └── exclude.xml                # SpotBugs exclusion filters
├── docker/
│   ├── Dockerfile                     # Production multi-stage image
│   └── docker-compose.yml             # Local dev: app + Elasticsearch
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI pipeline
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/productcatalog/
│   │   │       ├── ProductCatalogApplication.java        # @SpringBootApplication entry point
│   │   │       ├── config/
│   │   │       │   ├── ElasticsearchConfig.java          # ES client bean, index settings
│   │   │       │   ├── OpenApiConfig.java                # Springdoc/OpenAPI configuration
│   │   │       │   └── MetricsConfig.java                # Micrometer custom metrics
│   │   │       ├── api/
│   │   │       │   ├── controller/
│   │   │       │   │   ├── ProductController.java        # REST endpoints: CRUD + search
│   │   │       │   │   └── HealthController.java         # Custom health endpoint (optional)
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── CreateProductRequest.java
│   │   │       │   │   │   ├── UpdateProductRequest.java
│   │   │       │   │   │   └── ProductSearchRequest.java # Filter/search params
│   │   │       │   │   └── response/
│   │   │       │   │       ├── ProductResponse.java
│   │   │       │   │       └── ProductSearchResponse.java # Paginated search results
│   │   │       │   └── mapper/
│   │   │       │       └── ProductMapper.java            # MapStruct: DTO ↔ Document
│   │   │       ├── domain/
│   │   │       │   ├── document/
│   │   │       │   │   └── ProductDocument.java          # @Document Elasticsearch entity
│   │   │       │   └── model/
│   │   │       │       └── Product.java                  # Core domain model (plain POJO)
│   │   │       ├── repository/
│   │   │       │   ├── ProductRepository.java            # ElasticsearchRepository interface
│   │   │       │   └── ProductSearchRepository.java      # Custom query methods (NativeQuery)
│   │   │       ├── service/
│   │   │       │   ├── ProductService.java               # Interface
│   │   │       │   └── impl/
│   │   │       │       └── ProductServiceImpl.java       # Business logic implementation
│   │   │       └── exception/
│   │   │           ├── ProductNotFoundException.java
│   │   │           ├── ProductAlreadyExistsException.java
│   │   │           └── GlobalExceptionHandler.java       # @RestControllerAdvice
│   │   └── resources/
│   │       ├── application.yml                           # Base configuration
│   │       ├── application-local.yml                     # Local dev overrides
│   │       ├── application-test.yml                      # Test profile overrides
│   │       └── elasticsearch/
│   │           └── product-index-settings.json           # Index mappings and settings
│   └── test/
│       └── java/
│           └── com/company/productcatalog/
│               ├── api/
│               │   └── controller/
│               │       └── ProductControllerTest.java    # Unit: MockMvc slice tests
│               ├── service/
│               │   └── impl/
│               │       └── ProductServiceImplTest.java   # Unit: Mockito-based tests
│               ├── repository/
│               │   └── ProductSearchRepositoryTest.java  # Integration: Testcontainers ES
│               ├── integration/
│               │   └── ProductCatalogIntegrationTest.java # Full-stack integration tests
│               └── util/
│                   └── TestDataFactory.java              # Shared test fixture builder
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

### Step 1 — Read and Understand Specifications
- Read all story-level spec documents provided in the task context.
- Identify all required endpoints, data models, search/filter behaviours, and non-functional requirements.
- Note any Elasticsearch index mapping requirements (field types, analyzers, nested objects).

### Step 2 — Create `tasks.md`
- Create `tasks.md` in the project root **before writing any code**.
- Break the work into atomic, checkable tasks. Example format:

```markdown
# tasks.md

## Setup
- [ ] Initialise Gradle project with required dependencies
- [ ] Create package structure

## Domain
- [ ] Define ProductDocument with Elasticsearch annotations
- [ ] Define Product domain model

## Repository Layer
- [ ] Implement ProductRepository (Spring Data)
- [ ] Implement ProductSearchRepository (NativeQuery)

## Service Layer
- [ ] Implement ProductServiceImpl with CRUD operations
- [ ] Implement search and filtering logic

## API Layer
- [ ] Implement ProductController endpoints
- [ ] Implement GlobalExceptionHandler

## Testing
- [ ] Unit tests: ProductServiceImplTest (≥90% coverage)
- [ ] Unit tests: ProductControllerTest (MockMvc)
- [ ] Integration tests: ProductSearchRepositoryTest (Testcontainers)
- [ ] Integration tests: ProductCatalogIntegrationTest

## Quality Gates
- [ ] Checkstyle passes with zero violations
- [ ] SpotBugs passes with zero HIGH/MEDIUM bugs
- [ ] All tests green
- [ ] Coverage report ≥90%
```

- Check off tasks as they are completed.

### Step 3 — Implement
- Follow the project structure in Section 2 exactly.
- Implement layers in this order: **Domain → Repository → Service → API → Exception Handling → Config**.
- Commit logical units of work (one layer or feature at a time).
- Apply all coding conventions from Section 4 throughout.

### Step 4 — Test
- Write unit tests alongside each implementation class (not after all code is done).
- Run the full test suite after each layer is complete:
  ```bash
  ./gradlew test
  ```
- Run coverage report and confirm ≥90%:
  ```bash
  ./gradlew jacocoTestReport jacocoTestCoverageVerification
  ```

### Step 5 — Validate
- Run static analysis:
  ```bash
  ./gradlew checkstyleMain spotbugsMain
  ```
- Build the production Docker image and confirm it starts:
  ```bash
  docker build -f docker/Dockerfile -t product-catalog-service:local .
  docker compose -f docker/docker-compose.yml up --wait
  ```
- Confirm Swagger UI loads at `http://localhost:8080/swagger-ui.html`.
- Confirm Actuator health at `http://localhost:8080/actuator/health` returns `UP`.
- Mark all `tasks.md` items as complete before declaring work done.

---

## 4. Coding Conventions

### General
- Use **Java 21** features where appropriate: records for DTOs, sealed interfaces for domain variants, pattern matching.
- Follow **Google Java Style Guide** (enforced by Checkstyle).
- Maximum line length: **120 characters**.
- All public classes, methods, and fields must have **Javadoc**.

### Naming
| Artifact | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `ProductServiceImpl` |
| Methods / variables | `camelCase` | `findByCategory` |
| Constants | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| Elasticsearch index | `kebab-case` | `product-catalog` |
| REST endpoints | `kebab-case` plural nouns | `/api/v1/products` |
| Application properties | `kebab-case` | `elasticsearch.connection-timeout` |
| Test classes | `<Subject>Test` | `ProductServiceImplTest` |

### Spring Boot Patterns
- Use **constructor injection** exclusively — no `@Autowired` on fields.
- Annotate service interfaces with `@Transactional` at the method level where applicable.
- Use `@RestController` + `@RequestMapping` (never `@Controller` for REST).
- Return `ResponseEntity<T>` from all controller methods for explicit HTTP status control.
- Use `@Validated` on controllers and `@Valid` on request body parameters.

### Elasticsearch Patterns
- Define all index mappings in `product-index-settings.json`; do **not** rely on dynamic mapping.
- Use `@Document(indexName = "product-catalog", createIndex = false)` — index creation is managed externally.
- Use `NativeQuery` with `QueryBuilders` for complex search/filter operations.
- Implement pagination using Spring Data's `Pageable` — default page size 20, max 100.
- Use `keyword` sub-fields for exact-match filtering alongside `text` fields for full-text search.

### DTO and Mapping
- Use **Java records** for immutable request/response DTOs.
- Use **MapStruct** for all DTO ↔ Document conversions; no manual mapping in service or controller.
- Never expose `ProductDocument` directly from the API layer.

### Error Handling
- All exceptions extend a base `ProductCatalogException` (runtime).
- `GlobalExceptionHandler` must return RFC 7807 Problem Detail responses (`ProblemDetail`).
- HTTP status mapping: `404` for not found, `409` for conflicts, `400` for validation errors, `500` for unexpected errors.

### Logging
- Use **SLF4J** with Logback (Spring Boot default).
- Log at `INFO` for significant business events, `DEBUG` for query details, `ERROR` with stack traces only for unexpected exceptions.
- Never log sensitive product pricing or PII data.

---

## 5. Testing

### Unit Tests
- **Framework:** JUnit 5 + Mockito
- **Controller tests:** Use `@WebMvcTest(ProductController.class)` with `MockMvc`; mock the service layer.
- **Service tests:** Use `@ExtendWith(MockitoExtension.class)`; mock all repository dependencies.
- **Coverage target:** ≥ **90%** line and branch coverage (enforced by JaCoCo).
- **Naming:** Test methods use `methodName_scenario_expectedResult` pattern.

```java
// Example test method naming
@Test
void findById_whenProductExists_returnsProductResponse() { ... }

@Test
void findById_whenProductNotFound_throwsProductNotFoundException() { ... }
```

### Integration Tests
- **Framework:** Testcontainers with `elasticsearch:8.13.0` Docker image.
- Annotate integration test classes with `@SpringBootTest` + `@Testcontainers`.
- Use `@DynamicPropertySource` to inject the Testcontainers Elasticsearch URL into Spring context.
- Integration tests must cover: index creation, document indexing, full-text search, filter queries, and pagination.

### Test Data
- All test fixtures are created via `TestDataFactory` utility class — no inline object construction in test methods.
- Use `@BeforeEach` to reset Elasticsearch index state between tests.

### Running Tests
```bash
# All tests
./gradlew test

# Unit tests only (excludes integration tag)
./gradlew test -PexcludeTags=integration

# Integration tests only
./gradlew test -PincludeTags=integration

# Coverage report (output: build/reports/jacoco/test/html/index.html)
./gradlew jacocoTestReport

# Enforce coverage threshold (fails build if <90%)
./gradlew jacocoTestCoverageVerification
```

### JaCoCo Configuration (in `build.gradle.kts`)
```kotlin
jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.90".toBigDecimal()
            }
        }
    }
}
// Exclude: generated mapper code, config classes, Application entry point
```

---

## 6. Docker & CI

### Dockerfile (`docker/Dockerfile`)
Use a **multi-stage build**:

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace
COPY gradle/ gradle/
COPY gradlew settings.gradle.kts build.gradle.kts ./
RUN ./gradlew dependencies --no-daemon          # cache dependency layer
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", \
            "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

### `docker/docker-compose.yml`
```yaml
services:
  elasticsearch:
    image: elasticsearch:8.13.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10

  product-catalog-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "8080:8080"