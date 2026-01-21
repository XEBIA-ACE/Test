#!/bin/bash

# Development startup script
# Starts all required services for local development

set -e

echo "Starting Authentication Service Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose is not installed"
  exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please review and update .env file with your configuration"
fi

# Start dependencies only (Redis and Keycloak)
echo "Starting Redis and Keycloak..."
docker-compose up -d redis keycloak

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check Redis
echo "Checking Redis..."
docker-compose exec -T redis redis-cli ping

# Check Keycloak
echo "Checking Keycloak..."
until curl -sf http://localhost:8180/health/ready > /dev/null; do
  echo "Waiting for Keycloak..."
  sleep 5
done

echo ""
echo "=========================================="
echo "Development environment is ready!"
echo "=========================================="
echo "Redis: localhost:6379"
echo "Keycloak: http://localhost:8180 (admin/admin)"
echo ""
echo "Next steps:"
echo "1. Run setup-keycloak.sh to configure Keycloak"
echo "2. Start the application with: mvn spring-boot:run"
echo "=========================================="
