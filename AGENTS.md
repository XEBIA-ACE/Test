# AGENTS.md

## Stack

- **Service:** Notification Worker
- **Type:** integration
- **Technologies:**
- Node.js (NestJS) OR Java (Spring Boot) consumer application
- RabbitMQ consumer (amqplib / Spring AMQP) or Apache Kafka consumer (kafkajs / Spring Kafka)
- SendGrid SDK or AWS SES SDK for email delivery
- Firebase Admin SDK or APNs HTTP/2 API for push notifications
- Handlebars or Thymeleaf for notification template rendering
- Docker for containerization
- Kubernetes for independent scaling of consumer replicas
- Prometheus + OpenTelemetry for delivery success/failure metrics
- **Responsibilities:**
- Subscribe to project.created, project.updated, and project.deleted event topics/queues on the message broker
- Apply per-user notification preference rules (opt-in/opt-out per channel and event type)
- Render notification content using templates (Handlebars / Thymeleaf) for email and in-app messages
- Dispatch email notifications via external email provider (SendGrid / AWS SES / SMTP)
- Dispatch push notifications via external push provider (Firebase FCM / APNs)
- Implement retry logic with exponential backoff for transient delivery failures
- Route undeliverable notifications to a dead-letter queue with alerting
- Implement idempotent processing to prevent duplicate notifications on redelivered events

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
