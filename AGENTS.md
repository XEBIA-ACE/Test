# AGENTS.md

## Stack

- **Service:** Product Service
- **Type:** business
- **Technologies:**
- NestJS (TypeScript) or FastAPI (Python)
- MongoDB / Amazon DynamoDB (write model — product catalog source of truth)
- Elasticsearch (read model — full-text search and filtered browsing)
- Redis 7+ (read model hot cache, cache-aside pattern)
- MongoDB Change Streams / Debezium (write-to-read model synchronisation)
- Mongoose (MongoDB ODM) or AWS SDK DynamoDB
- OpenTelemetry SDK (distributed tracing)
- **Responsibilities:**
- Serve product catalog browsing and listing queries from the optimised read model (Redis + Elasticsearch)
- Handle full-text product search and attribute-based filtering via Elasticsearch
- Manage product catalog creation and updates via the write model (MongoDB/DynamoDB)
- Apply CQRS — separate command handlers (write) and query handlers (read) with independent data paths
- Synchronise write model changes to read model using MongoDB Change Streams or Debezium CDC
- Cache frequently accessed product data in Redis using cache-aside pattern
- Expose product category listings
- Enforce admin role authorisation on write (mutation) endpoints

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
