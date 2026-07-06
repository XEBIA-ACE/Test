# AGENTS.md

## Stack

- **Service:** Project Service
- **Type:** business
- **Technologies:**
- Node.js with NestJS (TypeScript) OR Java with Spring Boot
- RESTful API with OpenAPI/Swagger documentation
- Prisma or TypeORM (Node.js) / Hibernate JPA (Java) for ORM
- PostgreSQL as primary relational database
- Redis (via ioredis / Lettuce) for read-through caching
- RabbitMQ or Apache Kafka for async domain event publishing
- Joi (Node.js) or Bean Validation (Java/Spring) for server-side input validation
- JWT / OAuth2 / OpenID Connect for authentication context
- Docker for containerization
- Kubernetes for orchestration and horizontal scaling
- Flyway or Liquibase for database schema migrations
- Prometheus + OpenTelemetry for metrics and distributed tracing
- **Responsibilities:**
- Expose RESTful CRUD API for project resources (create, list, get, update, soft-delete)
- Enforce server-side mandatory field validation on create and update operations (name, description, status, owner)
- Apply RBAC authorization checks (Admin, Project Manager, Viewer) before executing any write operation
- Implement optimistic locking via version column to prevent concurrent edit conflicts and return HTTP 409 on version mismatch
- Enforce soft-delete semantics: set is_deleted=true, deleted_at, deleted_by; never physically remove records
- Apply read-through cache pattern: serve list and detail reads from Redis, invalidate cache on all write operations
- Emit domain events (ProjectCreated, ProjectUpdated, ProjectDeleted) asynchronously after successful transaction commit via message broker
- Support paginated and filtered project list queries (by status, owner, name, date range)
- Map domain entities to/from DTOs for API contract enforcement
- Maintain full audit trail columns (created_at, created_by, updated_at, updated_by) on all project records
- Consume and validate JWT claims forwarded by the API Gateway for identity and role context
- Handle conflict resolution responses with descriptive error messages for optimistic lock failures

## General Rules

- Always read files in /specs before implementing
- Never implement without acceptance criteria
- Code should be simple and readable
- Avoid overengineering
- The project follows a hexagonal architecture

## Required Workflow

1. Read the specs in the /specs directory
2. Generate tasks.md if it does not exist
3. Implement based on the tasks
4. Create automated tests
5. Validate acceptance criteria

## Testing

- Cover all acceptance criteria
- Tests should be clear and straightforward
- Generated code must reach **90% unit test coverage**

## Constraints

- Do not invent requirements that are not described
- Do not change behavior without updating the spec
