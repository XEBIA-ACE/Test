# Quick Start Guide

Get the Notification Service up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- (Optional) SendGrid API key for email notifications
- (Optional) Firebase credentials for push notifications

## Step 1: Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd notification-service

# Copy environment configuration
cp .env.example .env
```

## Step 2: Start the Service

```bash
# Start all services (PostgreSQL, Redis, Kafka, Notification Service)
docker-compose up -d

# Check that all services are running
docker-compose ps

# View logs
docker-compose logs -f notification-service
```

## Step 3: Run Database Migrations

```bash
docker-compose exec notification-service npm run migrate
```

## Step 4: Test the Service

### Health Check

```bash
curl http://localhost:3000/health
```

### Create an Email Notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": {
      "email": "test@example.com",
      "userId": "user-123"
    },
    "payload": {
      "subject": "Test Notification",
      "body": "This is a test notification from the notification service!"
    },
    "priority": "high"
  }'
```

### Get Notification Status

```bash
# Replace {id} with the notification ID from the previous response
curl http://localhost:3000/api/v1/notifications/{id}
```

## Step 5: Explore the API

Open your browser and visit:
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health/detailed

## WebSocket Example

Connect to the WebSocket server to receive real-time notifications:

```javascript
// In your browser console or Node.js app
const socket = io('http://localhost:3001', { path: '/notifications' });

socket.emit('register', 'user-123');

socket.on('notification', (data) => {
  console.log('Received notification:', data);
});
```

## Stopping the Service

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (removes all data)
docker-compose down -v
```

## Next Steps

1. Configure SendGrid API key in `.env` to enable email notifications
2. Set up Firebase credentials for push notifications
3. Read the full README.md for detailed documentation
4. Explore the API endpoints in Swagger UI
5. Check the test suite with `npm test`

## Common Commands

```bash
# View all logs
docker-compose logs -f

# View service-specific logs
docker-compose logs -f notification-service
docker-compose logs -f kafka
docker-compose logs -f postgres

# Restart a specific service
docker-compose restart notification-service

# Rebuild and restart
docker-compose up -d --build notification-service

# Access the database
docker-compose exec postgres psql -U postgres -d notification_service

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Troubleshooting

### Service won't start
```bash
# Check logs for errors
docker-compose logs notification-service

# Ensure all ports are available
netstat -an | grep -E "3000|3001|5432|6379|9092"
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Run migrations
docker-compose exec notification-service npm run migrate
```

### Kafka connection failed
```bash
# Check Kafka is running
docker-compose ps kafka

# Wait for Kafka to be ready (may take 30-60 seconds)
docker-compose logs kafka | grep "started"
```

## Development Mode

To run in development mode with hot-reload:

```bash
# Start infrastructure only
docker-compose up -d postgres redis zookeeper kafka

# Install dependencies locally
npm install

# Configure environment
cp .env.example .env

# Run migrations
npm run migrate

# Start development server
npm run dev
```

That's it! You now have a fully functional notification service running locally.

For more detailed information, see the main README.md file.
