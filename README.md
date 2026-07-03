# Event Processing Service

A production-ready **integration service** that subscribes to project events,
triggers downstream actions, and dispatches notifications.

Built with **FastAPI**, **Kafka**, and **RabbitMQ**, following
[Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
(Ports & Adapters).

---

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Docker](#docker)
- [API Reference](#api-reference)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Inbound Adapters                         │
│   KafkaConsumerAdapter   │   RabbitMQConsumerAdapter            │
└──────────────┬──────────────────────────┬───────────────────────┘
               │  EventConsumerPort       │
               ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
│                    HandleEventUseCase                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
               ┌───────────▼───────────┐
               │    Domain Layer       │
               │   EventProcessor      │
               └───────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
ActionDispatcherPort  NotificationSenderPort  EventPublisherPort
        │                  │
        ▼                  ▼
HttpActionDispatcher  EmailNotificationSender
(Outbound Adapters)
```

The **domain layer** is completely free of I/O and framework dependencies.
All external concerns (Kafka, RabbitMQ, SMTP, HTTP) live in **adapters** that
implement abstract **ports**.

---

## Technology Stack

| Concern          | Technology          |
|------------------|---------------------|
| HTTP framework   | FastAPI + Uvicorn   |
| Message broker 1 | Apache Kafka        |
| Message broker 2 | RabbitMQ            |
| Configuration    | pydantic-settings   |
| Testing          | pytest + httpx      |
| Container        | Docker              |

---

## Project Structure

```
.
├── app/
│   ├── api/                  # HTTP inbound adapter (FastAPI)
│   │   ├── app.py            # Application factory
│   │   └── routes/
│   │       └── health.py     # Health check endpoint
│   ├── adapters/             # Concrete port implementations
│   │   ├── kafka_consumer.py
│   │   ├── rabbitmq_consumer.py
│   │   ├── notification_sender.py
│   │   └── action_dispatcher.py
│   ├── application/
│   │   └── use_cases.py      # HandleEventUseCase
│   ├── domain/
│   │   ├── models.py         # Event, Action, Notification
│   │   └── services.py       # EventProcessor (pure domain logic)
│   ├── ports/
│   │   ├── inbound.py        # EventConsumerPort, EventHandlerPort
│   │   └── outbound.py       # ActionDispatcherPort, NotificationSenderPort
│   ├── config.py             # Settings (pydantic-settings)
│   └── container.py          # Dependency wiring
├── tests/
│   ├── test_health.py
│   ├── test_domain_models.py
│   ├── test_event_processor.py
│   └── test_use_cases.py
├── main.py                   # Service entrypoint
├── Dockerfile
├── .dockerignore
├── .env.example
├── requirements.txt
├── requirements-dev.txt
└── pyproject.toml
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- (Optional) Docker & Docker Compose
- (Optional) Running Kafka / RabbitMQ brokers

### Local setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd event-processing-service

# 2. Create a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 4. Configure environment
cp .env.example .env
# Edit .env as needed

# 5. Start the service
python main.py
```

The service will be available at `http://localhost:8000`.

---

## Configuration

All configuration is driven by environment variables (or a `.env` file).
See [`.env.example`](.env.example) for the full list.

| Variable                    | Default                              | Description                        |
|-----------------------------|--------------------------------------|------------------------------------|
| `PORT`                      | `8000`                               | HTTP server port                   |
| `LOG_LEVEL`                 | `INFO`                               | Logging level                      |
| `KAFKA_BOOTSTRAP_SERVERS`   | `localhost:9092`                     | Kafka broker address(es)           |
| `KAFKA_TOPICS`              | `["project-events"]`                 | Topics to subscribe to             |
| `KAFKA_ENABLED`             | `true`                               | Enable Kafka consumer              |
| `RABBITMQ_URL`              | `amqp://guest:guest@localhost:5672/` | RabbitMQ connection URL            |
| `RABBITMQ_ENABLED`          | `false`                              | Enable RabbitMQ consumer           |
| `SMTP_HOST`                 | `localhost`                          | SMTP server host                   |
| `ACTION_DISPATCHER_BASE_URL`| `http://localhost:8080`              | Base URL for action HTTP calls     |

---

## Running Tests

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app --cov-report=term-missing
```

---

## Docker

### Build

```bash
docker build -t event-processing-service .
```

### Run

```bash
docker run -p 8000:8000 \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  -e KAFKA_ENABLED=true \
  event-processing-service
```

### Docker Compose (example)

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      KAFKA_ENABLED: "true"
    depends_on:
      - kafka

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
```

---

## API Reference

### `GET /health`

Returns the liveness status of the service.

**Response 200**

```json
{
  "status": "ok",
  "service": "event-processing-service",
  "version": "0.1.0"
}
```

---

## Event Schema

Events consumed from Kafka / RabbitMQ must follow this JSON structure:

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "project.created",
  "source": "project-service",
  "occurred_at": "2024-01-01T12:00:00Z",
  "correlation_id": "optional-trace-id",
  "payload": {
    "project_id": "proj-123",
    "owner_email": "owner@example.com"
  }
}
```

Supported `event_type` values:

- `project.created`
- `project.updated`
- `project.deleted`
- `task.created`
- `task.updated`
- `task.completed`
- `generic`

---

## License

MIT
