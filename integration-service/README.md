# Integration Service

A production-ready integration service built with Node.js, Express, and TypeScript. This service provides a robust platform for managing integrations between various systems using REST/SOAP protocols, message queues (Kafka/RabbitMQ), and caching (Redis).

## Features

- **Clean Architecture**: Separation of concerns with Domain, Application, Infrastructure, and API layers
- **Multiple Message Brokers**: Support for both Kafka and RabbitMQ
- **Caching Layer**: Redis-based caching for improved performance
- **REST & SOAP Support**: Flexible API client with retry logic and error handling
- **Database Migrations**: PostgreSQL with automated migration system
- **Comprehensive Logging**: Structured logging with Pino
- **Metrics & Monitoring**: Prometheus metrics and health check endpoints
- **API Documentation**: OpenAPI/Swagger documentation
- **Docker Support**: Multi-stage builds and docker-compose setup
- **Type Safety**: Full TypeScript implementation
- **Testing**: Jest setup with unit and integration test examples

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Queues**: Kafka & RabbitMQ
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Architecture

The service follows Clean Architecture principles with clear separation of layers:

```
src/
├── api/                    # API Layer (Controllers, Routes, Middleware)
│   ├── controllers/        # Request handlers
│   ├── routes/            # Route definitions
│   ├── middleware/        # Express middleware
│   ├── validators/        # Request validation schemas
│   └── docs/              # API documentation
├── application/           # Application Layer (Business Logic)
│   ├── services/          # Application services
│   └── interfaces/        # Port interfaces
├── domain/                # Domain Layer (Entities, Business Rules)
│   ├── entities/          # Domain entities
│   └── repositories/      # Repository interfaces
├── infrastructure/        # Infrastructure Layer (External Services)
│   ├── database/          # Database implementations
│   ├── cache/             # Cache implementations
│   ├── messaging/         # Message broker implementations
│   └── http/              # HTTP client implementations
├── config/                # Configuration
├── utils/                 # Utilities (Logger, Errors)
├── app.ts                 # Application setup
└── index.ts               # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Docker and Docker Compose (for containerized setup)
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)
- Kafka or RabbitMQ (if running locally)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd integration-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate:up
   ```

### Running Locally

**Development mode with hot reload**:
```bash
npm run dev
```

**Build for production**:
```bash
npm run build
npm start
```

**Run tests**:
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

**Linting and formatting**:
```bash
npm run lint
npm run lint:fix
npm run format
```

### Running with Docker

**Start all services** (PostgreSQL, Redis, Kafka, RabbitMQ, and the application):
```bash
docker-compose up -d
```

**View logs**:
```bash
docker-compose logs -f integration-service
```

**Stop services**:
```bash
docker-compose down
```

**Development mode with hot reload**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## API Documentation

Once the service is running, access the interactive API documentation at:

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: `src/api/docs/swagger.yaml`

### Available Endpoints

#### Integrations

- `POST /api/v1/integrations` - Create a new integration
- `GET /api/v1/integrations` - List all integrations (with filtering)
- `GET /api/v1/integrations/:id` - Get integration by ID
- `POST /api/v1/integrations/:id/process` - Process an integration

#### Health Checks

- `GET /health` - General health check
- `GET /ready` - Readiness check (dependencies)
- `GET /live` - Liveness check

#### Monitoring

- `GET /metrics` - Prometheus metrics endpoint

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

### Key Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | HTTP server port | 3000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `KAFKA_BROKERS` | Kafka broker addresses | localhost:9092 |
| `RABBITMQ_URL` | RabbitMQ connection URL | amqp://guest:guest@localhost:5672 |
| `LOG_LEVEL` | Logging level | info |

## Database

### Schema

The service uses PostgreSQL with the following main tables:

- **integrations**: Stores integration requests and responses
- **audit_logs**: Audit trail for all integration activities

### Migrations

**Run migrations**:
```bash
npm run migrate:up
```

**Rollback last migration**:
```bash
npm run migrate:down
```

**Create new migration**:
```bash
npm run migrate:create
```

Migration files are located in `src/infrastructure/database/migrations/`.

## Message Queues

The service supports both Kafka and RabbitMQ for async message processing.

### Topics/Queues

- `integration.requests` - Integration processing requests
- `integration.responses` - Integration processing responses
- `integration.events` - Integration status events

### Switching Message Brokers

Update the dependency injection in `src/app.ts`:

```typescript
// For Kafka
import { KafkaMessageBroker } from './infrastructure/messaging/KafkaMessageBroker';
this.messageBroker = new KafkaMessageBroker();

// For RabbitMQ
import { RabbitMQMessageBroker } from './infrastructure/messaging/RabbitMQMessageBroker';
this.messageBroker = new RabbitMQMessageBroker();
```

## Caching

Redis is used for caching integration results and improving performance. Cache TTL is configurable via environment variables.

## Logging

Structured JSON logging is implemented using Pino. Logs include:

- Request/response logging with correlation IDs
- Error tracking with stack traces
- Performance metrics
- Audit trails

**Log levels**: error, warn, info, debug

## Monitoring & Observability

### Health Checks

- `/health` - Basic health status
- `/ready` - Dependency readiness (database, cache, message queue)
- `/live` - Application liveness

### Metrics

Prometheus metrics are exposed at `/metrics`:

- HTTP request counters and histograms
- Integration processing metrics
- Custom business metrics

## Security

- **Helmet**: Security headers
- **CORS**: Configurable CORS policies
- **Input Validation**: Joi-based request validation
- **Error Handling**: Safe error responses (no stack traces in production)
- **Rate Limiting**: Ready for rate limiting middleware
- **Environment Variables**: Sensitive data never hardcoded

## Error Handling

Custom error classes provide consistent error handling:

- `ValidationError` - Input validation failures (400)
- `NotFoundError` - Resource not found (404)
- `UnauthorizedError` - Authentication failures (401)
- `ForbiddenError` - Authorization failures (403)
- `ConflictError` - Resource conflicts (409)
- `IntegrationError` - External service failures (502)
- `ServiceUnavailableError` - Service unavailable (503)

## Testing

The service includes a comprehensive test setup:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- IntegrationService.test.ts
```

Test structure:
```
tests/
├── unit/              # Unit tests
│   ├── services/
│   └── repositories/
├── integration/       # Integration tests
│   └── api/
└── setup.ts          # Test configuration
```

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Configure proper database credentials
3. Set secure JWT secret and API keys
4. Configure CORS for your domain
5. Enable HTTPS
6. Set up log aggregation
7. Configure monitoring and alerting
8. Run database migrations
9. Test health check endpoints
10. Configure auto-scaling if needed

### Docker Production Build

```bash
docker build -t integration-service:latest .
docker run -p 3000:3000 --env-file .env integration-service:latest
```

### Kubernetes Deployment

Kubernetes manifests can be created based on the Docker setup. Key considerations:

- Use ConfigMaps for configuration
- Use Secrets for sensitive data
- Configure livenessProbe and readinessProbe
- Set resource limits
- Use HPA for auto-scaling

## Performance Optimization

- Connection pooling for database (configurable pool size)
- Redis caching with configurable TTL
- Compression middleware for HTTP responses
- Async processing via message queues
- Retry logic with exponential backoff

## Troubleshooting

### Common Issues

**Database connection failed**:
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check network connectivity

**Redis connection failed**:
- Check Redis is running
- Verify host and port in `.env`

**Kafka/RabbitMQ connection failed**:
- Check message broker is running
- Verify broker URLs in `.env`
- Check firewall rules

**Service won't start**:
- Check logs for errors
- Verify all dependencies are running
- Check port 3000 is available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@example.com

## Changelog

See CHANGELOG.md for version history and changes.
