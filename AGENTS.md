# AGENTS.md

## Stack

- **Service:** Notification Service
- **Type:** integration
- **Technologies:**
- Node.js with Bull queue workers or Python with Celery workers
- Handlebars (Node.js) or Jinja2 (Python) — notification templating
- SendGrid SDK / AWS SES SDK (email delivery)
- Twilio SDK / AWS SNS SDK (SMS delivery)
- Apache Kafka Consumer Group / RabbitMQ AMQP consumer (event consumption)
- AWS Secrets Manager / HashiCorp Vault (API key management)
- OpenTelemetry SDK (distributed tracing with trace context propagation from events)
- **Responsibilities:**
- Consume UserRegistered, OTPRequested, EmailVerificationRequested, and AccountActivated events from the Event Bus
- Dispatch email verification links to newly registered email-path users via SendGrid / AWS SES
- Dispatch OTP codes via SMS to mobile-registered users via Twilio / AWS SNS
- Send welcome onboarding emails following successful account activation
- Implement idempotent event processing to handle at-least-once delivery safely
- Apply retry logic with exponential backoff for transient provider failures
- Escalate undeliverable messages to Dead Letter Queue with alerting
- Render notification content using templating engine (Handlebars / Jinja2)
- Store third-party provider API keys securely via AWS Secrets Manager / HashiCorp Vault

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
