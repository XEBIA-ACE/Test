#!/bin/bash

# Integration Service Setup Script
# This script helps set up the development environment

set -e

echo "=========================================="
echo "Integration Service Setup"
echo "=========================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker is recommended for running services."
    echo "   You can install Docker from: https://docs.docker.com/get-docker/"
    DOCKER_AVAILABLE=false
else
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) detected"
    DOCKER_AVAILABLE=true
fi

# Check Docker Compose installation
if ! command -v docker-compose &> /dev/null; then
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "⚠️  Docker Compose is not installed"
        COMPOSE_AVAILABLE=false
    fi
else
    echo "✅ Docker Compose $(docker-compose -v | cut -d' ' -f3 | cut -d',' -f1) detected"
    COMPOSE_AVAILABLE=true
fi

echo ""
echo "Installing npm dependencies..."
npm install

echo ""
echo "✅ Dependencies installed successfully"

# Setup environment file
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please review and update .env file with your configuration"
else
    echo ""
    echo "⚠️  .env file already exists. Skipping creation."
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""

# Provide next steps based on available tools
if [ "$COMPOSE_AVAILABLE" = true ]; then
    echo "🚀 Quick Start with Docker:"
    echo "   docker-compose up -d"
    echo ""
    echo "   This will start:"
    echo "   - PostgreSQL database"
    echo "   - Redis cache"
    echo "   - Kafka message broker"
    echo "   - RabbitMQ message broker"
    echo "   - Integration Service"
    echo ""
    echo "📝 Access the application:"
    echo "   - API:         http://localhost:3000"
    echo "   - API Docs:    http://localhost:3000/api-docs"
    echo "   - Health:      http://localhost:3000/health"
    echo "   - Metrics:     http://localhost:3000/metrics"
    echo "   - pgAdmin:     http://localhost:5050"
    echo "   - RabbitMQ UI: http://localhost:15672"
    echo ""
elif [ "$DOCKER_AVAILABLE" = true ]; then
    echo "⚠️  Docker is available but Docker Compose is not installed"
    echo "   Install Docker Compose to use the quick start"
    echo ""
fi

echo "🛠️  Alternative - Local Development:"
echo "   1. Ensure PostgreSQL, Redis, and Kafka/RabbitMQ are running"
echo "   2. Update .env with your local configuration"
echo "   3. Run migrations: npm run migrate:up"
echo "   4. Start development server: npm run dev"
echo ""

echo "📖 For more information, see README.md"
echo ""

# Ask if user wants to start services
if [ "$COMPOSE_AVAILABLE" = true ]; then
    echo ""
    read -p "Would you like to start services with Docker Compose now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting services..."
        docker-compose up -d

        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10

        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "📝 Application is now running at:"
        echo "   http://localhost:3000"
        echo ""
        echo "   View logs: docker-compose logs -f"
        echo "   Stop services: docker-compose down"
    fi
fi

echo ""
echo "Happy coding! 🎉"
