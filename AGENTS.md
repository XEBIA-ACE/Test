# AGENTS.md

## Stack

- **Service:** Wishlist Service
- **Type:** business
- **Technologies:**
- NestJS (TypeScript) or FastAPI (Python)
- MongoDB / Amazon DynamoDB (wishlist document store — C-08)
- Mongoose (MongoDB ODM) or AWS SDK DynamoDB
- JWT middleware (jsonwebtoken / PyJWT) for user identity extraction from token claims
- OpenTelemetry SDK (distributed tracing)
- **Responsibilities:**
- Create and manage named wishlists per authenticated user
- Add and remove product references (by product ID) from wishlist items
- Retrieve all wishlists and their items for the authenticated user
- Enforce user-scoped data isolation — JWT subject claim must match wishlist owner ID
- Support multiple wishlists per user
- Validate that referenced product IDs exist (via lightweight Product Service call or event-sourced cache)
- Delete wishlists and cascade-remove associated items

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
