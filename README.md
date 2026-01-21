# Notification Service

A production-ready notification service built with Node.js and TypeScript, featuring Apache Kafka for message queuing, SendGrid for emails, Firebase Cloud Messaging for push notifications, WebSockets for real-time updates, and Redis for caching and rate limiting.

## Features

- **Multi-Channel Notifications**: Email (SendGrid), Push (FCM), WebSocket, SMS support
- **Apache Kafka Integration**: Asynchronous message processing with retry and DLQ
- **Redis Caching**: High-performance caching and rate limiting
- **WebSocket Server**: Real-time notification delivery
- **Clean Architecture**: Clear separation of concerns with domain-driven design
- **PostgreSQL Database**: Persistent notification storage with full audit trail
- **RESTful API**: Well-documented endpoints with OpenAPI/Swagger
- **Rate Limiting**: Protect against abuse with configurable limits
- **Health Checks & Metrics**: Production-ready observability
- **Docker Support**: Complete containerized deployment with docker-compose
- **Scheduled Notifications**: Support for future-dated notifications
- **Retry Mechanism**: Automatic retries with exponential backoff
- **Dead Letter Queue**: Failed messages handling

## Technology Stack

- **Node.js 18** with **TypeScript**
- **Express.js** - Web framework
- **Apache Kafka** - Message queue
- **SendGrid** - Email delivery
- **Firebase Cloud Messaging** - Push notifications
- **Socket.IO** - WebSocket implementation
- **Redis** - Caching and rate limiting
- **PostgreSQL** - Primary database
- **Docker & Docker Compose** - Containerization

## Architecture

The application follows Clean Architecture principles with clear layer separation:

```
src/
├── domain/                      # Domain Layer
│   ├── models/                  # Domain entities
│   └── interfaces/              # Repository and service interfaces
├── application/                 # Application Layer
│   └── services/                # Business logic and use cases
├── infrastructure/              # Infrastructure Layer
│   ├── database/                # Database connection and repositories
│   ├── cache/                   # Redis implementation
│   ├── messaging/               # Kafka implementation
│   ├── providers/               # Notification providers (Email, Push, WS)
│   └── logging/                 # Logging configuration
├── api/                         # API Layer
│   ├── controllers/             # HTTP controllers
│   ├── routes/                  # Route definitions
│   ├── middleware/              # Express middleware
│   └── swagger.ts               # API documentation
└── config/                      # Configuration management
```

### Layer Responsibilities

- **Domain Layer**: Core business entities and interfaces (no dependencies)
- **Application Layer**: Business logic, orchestration, and use cases
- **Infrastructure Layer**: External integrations (DB, cache, queue, providers)
- **API Layer**: HTTP interface, validation, and error handling

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)
- Apache Kafka (if running locally)
- SendGrid API key (for email notifications)
- Firebase Admin SDK credentials (for push notifications)

## Getting Started

### Option 1: Docker Compose (Recommended)

The easiest way to run the entire stack:

```bash
# Clone the repository
git clone <repository-url>
cd notification-service

# Copy environment file and configure
cp .env.example .env

# Edit .env with your SendGrid API key and Firebase credentials
nano .env

# Start all services (PostgreSQL, Redis, Kafka, Notification Service)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f notification-service

# Run database migrations
docker-compose exec notification-service npm run migrate
```

The services will be available at:
- **Notification Service API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **WebSocket Server**: ws://localhost:3001/notifications
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

### Option 2: Local Development

Run the application locally with Docker dependencies:

```bash
# 1. Start infrastructure services only
docker-compose up -d postgres redis zookeeper kafka

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
npm run migrate

# 5. Start the application in development mode
npm run dev
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for all options):

```env
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notification_service
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Notification Service

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_PATH=./firebase-admin-sdk.json

# WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_EMAIL=true
ENABLE_PUSH=true
ENABLE_WEBSOCKET=true
```

### SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key from Settings > API Keys
3. Set `SENDGRID_API_KEY` in your `.env` file
4. Configure sender email and name

### Firebase Cloud Messaging Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Go to Project Settings > Service Accounts
3. Generate a new private key
4. Save the JSON file as `firebase-admin-sdk.json` in the project root
5. Set `FIREBASE_PROJECT_ID` in your `.env` file

## API Documentation

### Swagger UI

Interactive API documentation is available at:
- http://localhost:3000/api-docs

### API Endpoints

#### Create Notification

```http
POST /api/v1/notifications
Content-Type: application/json

{
  "type": "email",
  "recipient": {
    "email": "user@example.com",
    "userId": "user-123"
  },
  "payload": {
    "subject": "Welcome!",
    "body": "Welcome to our service",
    "data": {
      "action": "welcome"
    }
  },
  "priority": "high",
  "scheduledAt": "2024-01-21T15:00:00Z"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "email",
    "status": "processing",
    "priority": "high",
    "createdAt": "2024-01-21T10:15:30Z"
  }
}
```

#### Get Notification by ID

```http
GET /api/v1/notifications/{id}
```

#### Get Notifications by Status

```http
GET /api/v1/notifications?status=sent&limit=50
```

#### Get Notifications by User

```http
GET /api/v1/notifications?userId=user-123&limit=50
```

#### Manually Send Notification

```http
POST /api/v1/notifications/{id}/send
```

#### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-21T10:15:30Z",
  "uptime": 3600,
  "service": "notification-service"
}
```

#### Detailed Health Check

```http
GET /health/detailed
```

Response:
```json
{
  "status": "ok",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "kafka": "healthy"
  }
}
```

### WebSocket Connection

Connect to receive real-time notifications:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  path: '/notifications'
});

// Register user to receive notifications
socket.emit('register', 'user-123');

// Listen for notifications
socket.on('notification', (data) => {
  console.log('Received notification:', data);
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to notification server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});
```

## Database Schema

The service uses PostgreSQL with the following main tables:

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| type | VARCHAR(20) | Notification type (email, push, websocket, sms) |
| recipient | JSONB | Recipient information |
| payload | JSONB | Notification content |
| status | VARCHAR(20) | Status (pending, processing, sent, failed, retrying) |
| priority | VARCHAR(10) | Priority level (low, medium, high, urgent) |
| attempts | INTEGER | Number of send attempts |
| max_attempts | INTEGER | Maximum allowed attempts |
| scheduled_at | TIMESTAMP | When to send (for scheduled notifications) |
| sent_at | TIMESTAMP | When successfully sent |
| failed_at | TIMESTAMP | When permanently failed |
| error | TEXT | Error message if failed |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### notification_templates

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| name | VARCHAR(255) | Template name |
| type | VARCHAR(20) | Notification type |
| subject | VARCHAR(500) | Email subject template |
| body_template | TEXT | Message body template |
| variables | TEXT[] | Available template variables |
| is_active | BOOLEAN | Template status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Kafka Topics

- **notifications**: Main topic for processing notifications
- **notifications-dlq**: Dead letter queue for failed messages

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration
```

### Test Structure

```
src/__tests__/
├── unit/                        # Unit tests
│   ├── NotificationService.test.ts
│   └── RateLimitService.test.ts
├── integration/                 # Integration tests
│   └── api.test.ts
└── setup.ts                     # Test configuration
```

## Building for Production

### Build TypeScript

```bash
npm run build
```

The compiled JavaScript will be in the `dist/` directory.

### Build Docker Image

```bash
docker build -t notification-service:1.0.0 .
```

### Run Production Build

```bash
# Set production environment
export NODE_ENV=production

# Run the built application
npm start
```

## Observability

### Logging

Structured logging with Pino:
- Development: Pretty-printed logs with colors
- Production: JSON logs for easy parsing

Log levels: error, warn, info, debug

### Health Checks

Built-in health check endpoints:
- `/health` - Basic health status
- `/health/detailed` - Includes dependency health
- `/health/metrics` - Application metrics

### Metrics

Access application metrics:
```bash
curl http://localhost:3000/health/metrics
```

Includes:
- Memory usage
- CPU usage
- Uptime
- Node.js version

## Security

### Rate Limiting

Configurable rate limiting per IP address:
- Default: 100 requests per minute
- Configurable via environment variables
- Redis-backed for distributed rate limiting

### Input Validation

All API endpoints use express-validator for:
- Type validation
- Format validation
- Required field validation
- Sanitization

### Authentication

Placeholder for JWT authentication (can be enabled):
- Bearer token support
- JWT secret configuration
- Token expiry management

## Performance

- **Redis caching**: Reduces database load for frequently accessed notifications
- **Kafka async processing**: Decouples notification creation from delivery
- **Connection pooling**: PostgreSQL and Redis connection pools
- **Retry mechanism**: Exponential backoff for failed deliveries
- **Scheduled processing**: Background job for scheduled notifications

## Troubleshooting

### Common Issues

**1. Kafka Connection Failed**
```bash
# Check Kafka is running
docker-compose ps kafka

# Check Kafka logs
docker-compose logs kafka

# Verify brokers configuration
echo $KAFKA_BROKERS
```

**2. SendGrid Email Not Sending**
- Verify API key is correct
- Check sender email is verified in SendGrid
- Review SendGrid dashboard for errors
- Check logs for error messages

**3. Firebase Push Notifications Failing**
- Ensure service account JSON is valid
- Verify project ID matches Firebase project
- Check device token format
- Review Firebase console for errors

**4. Database Migration Issues**
```bash
# Run migrations manually
npm run migrate

# Check database connection
psql -h localhost -U postgres -d notification_service
```

### Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f notification-service

# Local
# Logs are output to console in development

# Production logs location
tail -f logs/app.log
```

## Development

### Code Style

- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful comments for complex logic
- Maintain test coverage above 80%

### Adding New Notification Providers

1. Create provider class implementing `INotificationProvider`
2. Add provider configuration to `config/index.ts`
3. Register provider in `app.ts`
4. Add feature flag to `.env.example`
5. Write tests for the provider
6. Update documentation

Example:
```typescript
// src/infrastructure/providers/SmsProvider.ts
export class SmsProvider implements INotificationProvider {
  async send(notification: Notification): Promise<SendResult> {
    // Implementation
  }

  validateRecipient(notification: Notification): boolean {
    // Validation
  }
}
```

### Project Scripts

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run migrate      # Run database migrations
npm run docker:up    # Start Docker Compose
npm run docker:down  # Stop Docker Compose
```

## Deployment

### Environment-Specific Configuration

Create environment-specific `.env` files:
- `.env.development`
- `.env.staging`
- `.env.production`

### Docker Deployment

```bash
# Build and push to registry
docker build -t your-registry/notification-service:1.0.0 .
docker push your-registry/notification-service:1.0.0

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

Sample Kubernetes manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: notification-service:1.0.0
        ports:
        - containerPort: 3000
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        # Add ConfigMap/Secret references
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Email: support@example.com

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with Node.js, TypeScript, and Modern DevOps Practices**
