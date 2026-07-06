# AGENTS.md

## Stack

- **Service:** User / Auth Service
- **Type:** business
- **Technologies:**
- NestJS (TypeScript) or FastAPI (Python)
- bcrypt / Argon2id (password hashing)
- PyJWT / jsonwebtoken (JWT handling)
- Prisma (TypeScript) or SQLAlchemy (Python) — ORM
- PostgreSQL 15+ with PgBouncer (user DB and outbox table)
- Redis 7+ (OTP TTL storage, refresh token metadata, revocation list)
- Apache Kafka / RabbitMQ (event publishing via outbox relay)
- Pydantic / Joi / class-validator (schema validation)
- OpenTelemetry SDK (distributed tracing)
- **Responsibilities:**
- Email-based user registration with email verification link flow
- Mobile/OTP-based user registration with time-limited, single-use OTP verification flow
- Server-side input validation and sanitisation for all registration and login payloads
- Secure password hashing using bcrypt (cost ≥12) or Argon2id
- Delegate JWT access token and refresh token issuance to the Identity Provider (IdP) on successful authentication
- Manage refresh token rotation and JTI-based revocation via Redis
- Enforce account lockout after repeated failed login attempts
- User profile CRUD operations (read, update name/email/mobile, delete)
- GDPR-compliant account deletion and data erasure flows
- Publish domain events atomically via Transactional Outbox pattern to the Event Bus
- Store and manage OTPs in Redis with TTL-based auto-expiry (5-minute window)
- Maintain immutable audit log records for all account change events in PostgreSQL

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
