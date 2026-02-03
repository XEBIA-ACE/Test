# Order Management Service

A production-ready microservice for managing orders built with Java, Spring Boot, and MySQL. This service follows Clean Architecture principles with clear separation of concerns, comprehensive testing, and enterprise-grade observability.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [Monitoring](#monitoring)
- [API Endpoints](#api-endpoints)

## Features

- **Order Management**: Create, read, update, and delete orders
- **Order Status Tracking**: Track order lifecycle from pending to delivery
- **Order Items Management**: Support for multiple items per order
- **Pagination Support**: Efficient retrieval of large order lists
- **Advanced Filtering**: Filter orders by customer, status, and date range
- **RESTful API**: Well-designed REST API with proper HTTP status codes
- **Input Validation**: Comprehensive request validation with detailed error messages
- **Exception Handling**: Global exception handling with standardized error responses
- **Database Migrations**: Automated database schema management with Flyway
- **Health Checks**: Built-in health check and readiness probes
- **Metrics & Observability**: Prometheus metrics and structured logging
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Docker Support**: Multi-stage Docker build with docker-compose

## Technology Stack

- **Java 17**: Latest LTS version
- **Spring Boot 3.2.1**: Framework for building production-ready applications
- **Spring Data JPA**: Data access layer with Hibernate
- **MySQL 8.0**: Relational database
- **Flyway**: Database migration tool
- **Lombok**: Reduces boilerplate code
- **SpringDoc OpenAPI**: API documentation (Swagger UI)
- **Micrometer**: Metrics collection with Prometheus support
- **Logstash Encoder**: Structured JSON logging
- **JUnit 5 & Mockito**: Unit and integration testing
- **Testcontainers**: Integration testing with containers
- **Maven**: Build and dependency management
- **Docker**: Containerization

## Architecture

The service follows **Clean Architecture** principles with clear layer separation:

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)               │
│          REST endpoints, request/response handling       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Application Layer (Services)                │
│        Business logic, orchestration, DTOs, mappers      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Domain Layer (Entities)                  │
│            Core business models and rules                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Infrastructure Layer (Repositories)              │
│              Data access and persistence                 │
└─────────────────────────────────────────────────────────┘
```

### Package Structure

```
com.orderservice/
├── api/                          # API Layer
│   ├── controller/              # REST controllers
│   ├── config/                  # OpenAPI configuration
│   └── exception/               # Exception handlers
├── application/                 # Application Layer
│   ├── dto/                     # Data Transfer Objects
│   ├── service/                 # Business logic services
│   ├── mapper/                  # Entity-DTO mappers
│   └── exception/               # Application exceptions
├── domain/                      # Domain Layer
│   └── model/                   # Domain entities
└── infrastructure/              # Infrastructure Layer
    └── repository/              # JPA repositories
```

## Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **MySQL 8.0+** (or use Docker Compose)
- **Docker** (optional, for containerized deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd order-management-service
```

### 2. Configure Database

Create a MySQL database:

```sql
CREATE DATABASE orderdb;
CREATE USER 'orderuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON orderdb.* TO 'orderuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```properties
DB_HOST=localhost
DB_PORT=3306
DB_NAME=orderdb
DB_USERNAME=orderuser
DB_PASSWORD=password
SERVER_PORT=8080
SPRING_PROFILE=dev
LOG_LEVEL=INFO
```

### 4. Build the Application

```bash
mvn clean package
```

### 5. Run the Application

```bash
# Using Maven
mvn spring-boot:run

# Or using the JAR file
java -jar target/order-management-service-1.0.0.jar
```

The application will start on `http://localhost:8080`.

### 6. Access API Documentation

Open your browser and navigate to:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/api-docs

## API Documentation

### Base URL

```
http://localhost:8080/api/v1
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create a new order |
| GET | `/orders/{id}` | Get order by ID |
| GET | `/orders` | Get all orders (paginated) |
| GET | `/orders/customer/{customerId}` | Get orders by customer |
| GET | `/orders/status/{status}` | Get orders by status |
| PATCH | `/orders/{id}/status` | Update order status |
| POST | `/orders/{id}/cancel` | Cancel an order |
| DELETE | `/orders/{id}` | Delete an order |
| GET | `/health` | Health check endpoint |
| GET | `/info` | Service information |

### Example Requests

#### Create Order

```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "currency": "USD",
    "shippingAddress": "123 Main St, New York, NY 10001",
    "billingAddress": "123 Main St, New York, NY 10001",
    "items": [
      {
        "productId": 101,
        "productName": "Laptop",
        "productSku": "LAPTOP-001",
        "quantity": 1,
        "unitPrice": 999.99
      }
    ]
  }'
```

#### Get Order by ID

```bash
curl http://localhost:8080/api/v1/orders/1
```

#### Update Order Status

```bash
curl -X PATCH http://localhost:8080/api/v1/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

## Database Schema

### Orders Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| order_number | VARCHAR(50) | Unique order identifier |
| customer_id | BIGINT | Customer identifier |
| customer_name | VARCHAR(255) | Customer name |
| customer_email | VARCHAR(255) | Customer email |
| status | VARCHAR(50) | Order status (PENDING, CONFIRMED, etc.) |
| total_amount | DECIMAL(10,2) | Order total amount |
| currency | VARCHAR(3) | Currency code (ISO 4217) |
| shipping_address | VARCHAR(500) | Shipping address |
| billing_address | VARCHAR(500) | Billing address |
| notes | VARCHAR(1000) | Additional notes |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| version | BIGINT | Optimistic locking version |

### Order Items Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| order_id | BIGINT | Foreign key to orders |
| product_id | BIGINT | Product identifier |
| product_name | VARCHAR(255) | Product name |
| product_sku | VARCHAR(100) | Product SKU |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL(10,2) | Price per unit |
| subtotal | DECIMAL(10,2) | Line item total |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Order Status Values

- `PENDING`: Order created, awaiting confirmation
- `CONFIRMED`: Order confirmed by customer
- `PROCESSING`: Order being processed
- `SHIPPED`: Order shipped to customer
- `DELIVERED`: Order delivered successfully
- `CANCELLED`: Order cancelled
- `REFUNDED`: Order refunded

## Configuration

### Application Profiles

The application supports multiple profiles:

- **dev**: Development environment (verbose logging, SQL logging)
- **prod**: Production environment (minimal logging, security hardened)
- **test**: Test environment (H2 in-memory database)

Activate a profile:

```bash
# Using Maven
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Using JAR
java -jar app.jar --spring.profiles.active=prod

# Using environment variable
export SPRING_PROFILES_ACTIVE=dev
```

### Key Configuration Properties

See `src/main/resources/application.yml` for all configuration options.

## Testing

The project includes comprehensive unit and integration tests.

### Run All Tests

```bash
mvn test
```

### Run Specific Test Class

```bash
mvn test -Dtest=OrderServiceTest
```

### Run Integration Tests

```bash
mvn verify
```

### Test Coverage

Generate test coverage report:

```bash
mvn clean test jacoco:report
```

View report: `target/site/jacoco/index.html`

## Docker Deployment

### Using Docker Compose (Recommended)

Start all services (MySQL + Order Service):

```bash
docker-compose -f docker-compose.order-service.yml up -d
```

Stop all services:

```bash
docker-compose -f docker-compose.order-service.yml down
```

View logs:

```bash
docker-compose -f docker-compose.order-service.yml logs -f order-service
```

### Using Docker Only

Build the image:

```bash
docker build -f Dockerfile.order-service -t order-service:1.0.0 .
```

Run the container:

```bash
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_NAME=orderdb \
  -e DB_USERNAME=orderuser \
  -e DB_PASSWORD=password \
  --name order-service \
  order-service:1.0.0
```

## Monitoring

### Health Checks

Check application health:

```bash
curl http://localhost:8080/actuator/health
```

### Metrics

View Prometheus metrics:

```bash
curl http://localhost:8080/actuator/prometheus
```

### With Monitoring Stack (Optional)

Start with Prometheus and Grafana:

```bash
docker-compose -f docker-compose.order-service.yml --profile monitoring up -d
```

Access:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### Logs

Application logs are written to:
- Console (structured JSON format)
- File: `logs/order-service.log`

View logs:

```bash
tail -f logs/order-service.log
```

## Production Deployment

### Best Practices

1. **Use environment-specific configuration**
   ```bash
   export SPRING_PROFILES_ACTIVE=prod
   ```

2. **Set appropriate JVM options**
   ```bash
   export JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"
   ```

3. **Configure connection pooling**
   - Adjust `DB_POOL_SIZE` based on load

4. **Enable HTTPS**
   - Configure SSL certificates in application.yml

5. **Set up database backups**
   - Regular MySQL backups

6. **Monitor metrics**
   - Configure Prometheus/Grafana dashboards

7. **Set up log aggregation**
   - Forward logs to centralized logging system

## Troubleshooting

### Connection Issues

If you can't connect to MySQL:

```bash
# Check MySQL is running
docker ps | grep mysql

# Check connection
mysql -h localhost -u orderuser -p orderdb
```

### Port Already in Use

Change the server port:

```bash
export SERVER_PORT=8081
```

### Database Migration Errors

Reset database:

```bash
docker-compose -f docker-compose.order-service.yml down -v
docker-compose -f docker-compose.order-service.yml up -d
```

## Development

### Code Style

The project follows standard Java conventions:
- Google Java Style Guide
- Use Lombok to reduce boilerplate
- Comprehensive JavaDoc comments

### Adding New Features

1. Create domain entities in `domain.model`
2. Add repositories in `infrastructure.repository`
3. Implement business logic in `application.service`
4. Create DTOs and mappers in `application.dto` and `application.mapper`
5. Add controllers in `api.controller`
6. Write tests for all layers
7. Update API documentation

## License

Apache 2.0

## Support

For issues and questions, please contact support@example.com
