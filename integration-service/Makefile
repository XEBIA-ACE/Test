# Integration Service Makefile
# Convenient commands for common operations

.PHONY: help install build start dev test clean docker-up docker-down migrate-up migrate-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build the application
	npm run build

start: ## Start the application in production mode
	npm start

dev: ## Start the application in development mode
	npm run dev

test: ## Run tests
	npm test

test-unit: ## Run unit tests only
	npm run test:unit

test-integration: ## Run integration tests only
	npm run test:integration

lint: ## Run linter
	npm run lint

lint-fix: ## Run linter and fix issues
	npm run lint:fix

format: ## Format code
	npm run format

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules dist coverage

docker-build: ## Build Docker image
	docker build -t integration-service:latest .

docker-up: ## Start all services with Docker Compose
	docker-compose up -d

docker-down: ## Stop all services
	docker-compose down

docker-logs: ## View logs from all services
	docker-compose logs -f

migrate-up: ## Run database migrations
	npm run migrate:up

migrate-down: ## Rollback last migration
	npm run migrate:down

migrate-create: ## Create a new migration
	npm run migrate:create

setup: install migrate-up ## Initial setup (install + migrate)
	@echo "Setup complete! Run 'make dev' to start the application"

docker-setup: docker-up ## Setup with Docker
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Setup complete! Application is running on http://localhost:3000"
