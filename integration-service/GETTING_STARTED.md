# Getting Started with Integration Service

This guide will help you get the Integration Service up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Docker & Docker Compose** (recommended) - [Download](https://docs.docker.com/get-docker/)

Optional (for local development without Docker):
- PostgreSQL 15+
- Redis 7+
- Kafka or RabbitMQ

## Quick Start (Docker - Recommended)

This is the fastest way to get started. All dependencies are included.

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd integration-service

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
- Check prerequisites
- Install npm dependencies
- Create .env file from template
- Offer to start services with Docker Compose

### 2. Start Services

If you didn't start services during setup:

```bash
docker-compose up -d
```

This starts:
- Integration Service (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Kafka (port 9092)
- RabbitMQ (port 5672, management UI: 15672)
- pgAdmin (port 5050)

### 3. Verify Installation

```bash
# Check service health
curl http://localhost:3000/health

# Run API tests
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

### 4. Access the Application

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin)
- **RabbitMQ Management**: http://localhost:15672 (guest / guest)

## Manual Setup (Without Docker)

If you prefer to run services locally without Docker:

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Ensure PostgreSQL is running, then:

```bash
# Create database
createdb integration_db

# Update .env with your database credentials
cp .env.example .env
# Edit .env file
```

### 3. Run Migrations

```bash
npm run migrate:up
```

### 4. Start External Services

Ensure the following are running:
- PostgreSQL on port 5432
- Redis on port 6379
- Kafka on port 9092 OR RabbitMQ on port 5672

### 5. Start the Application

```bash
# Development mode with hot reload
npm run dev

# Or build and run production mode
npm run build
npm start
```

## Making Your First API Call

### Create an Integration

```bash
curl -X POST http://localhost:3000/api/v1/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "CRM",
    "targetSystem": "ERP",
    "operation": "createOrder",
    "payload": {
      "orderId": "ORD-12345",
      "customerId": "CUST-001",
      "amount": 1000,
      "items": [
        {"sku": "ITEM-001", "quantity": 2}
      ]
    }
  }'
```

### Get Integration Status

```bash
# Replace {id} with the ID from the create response
curl http://localhost:3000/api/v1/integrations/{id}
```

### List All Integrations

```bash
curl http://localhost:3000/api/v1/integrations
```

### List with Filters

```bash
curl "http://localhost:3000/api/v1/integrations?sourceSystem=CRM&status=COMPLETED&limit=10"
```

## Development Workflow

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (runs tests on file changes)
npm run test:watch

# With coverage report
npm test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Migrations

```bash
# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create
```

### Viewing Logs

```bash
# Docker logs
docker-compose logs -f integration-service

# View all services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
```

## Using the Makefile

The project includes a Makefile for common tasks:

```bash
# Show all available commands
make help

# Install dependencies
make install

# Start development mode
make dev

# Run tests
make test

# Start with Docker
make docker-up

# Stop Docker services
make docker-down

# View Docker logs
make docker-logs

# Run migrations
make migrate-up

# Complete setup
make setup
```

## API Documentation

Once the service is running, you can:

1. **View Interactive Docs**: http://localhost:3000/api-docs
2. **Test Endpoints**: Use the Swagger UI "Try it out" feature
3. **View OpenAPI Spec**: `src/api/docs/swagger.yaml`

## Configuration

### Environment Variables

Edit `.env` file to configure:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=integration_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Logging
LOG_LEVEL=info
```

### Switching Message Brokers

By default, the service uses Kafka. To switch to RabbitMQ:

1. Edit `src/app.ts`
2. Replace `KafkaMessageBroker` with `RabbitMQMessageBroker`
3. Restart the service

## Common Tasks

### Adding a New Integration Type

1. Update domain entities if needed
2. Add business logic in `IntegrationService`
3. Create/update API endpoints
4. Add validation schemas
5. Write tests
6. Update API documentation

### Adding a New Dependency

```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name
```

### Debugging

```bash
# Enable debug logs
LOG_LEVEL=debug npm run dev

# Use VS Code debugger
# Add breakpoints and press F5
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -l`

### Docker Issues

```bash
# Restart all services
docker-compose restart

# Rebuild containers
docker-compose up -d --build

# View container logs
docker-compose logs -f

# Clean up everything
docker-compose down -v
```

### Tests Failing

1. Ensure test database is configured
2. Check environment variables
3. Run: `npm install` to ensure dependencies are up to date

## Next Steps

1. **Explore the Code**: Start with `src/app.ts` and `src/index.ts`
2. **Read the Docs**: Check out `README.md` for detailed information
3. **Customize**: Modify for your specific integration needs
4. **Deploy**: See deployment section in `README.md`

## Getting Help

- Check `README.md` for detailed documentation
- Review `CONTRIBUTING.md` for development guidelines
- Look at example tests in `tests/` directory
- Explore API docs at `/api-docs` endpoint

## Additional Resources

- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Quick Reference Card

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Run tests
npm test

# Start development
npm run dev

# Check health
curl http://localhost:3000/health

# API docs
open http://localhost:3000/api-docs
```

Happy coding! If you have any questions, feel free to open an issue.
