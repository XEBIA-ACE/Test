#!/bin/bash
# ============================================================================
# Build Script
# ============================================================================

set -e

echo "================================================"
echo "Building Configuration Service"
echo "================================================"

# Clean and compile
echo "Running Maven clean and compile..."
mvn clean compile

# Run tests
echo "Running tests..."
mvn test

# Package
echo "Packaging application..."
mvn package -DskipTests

echo "================================================"
echo "Build completed successfully!"
echo "JAR location: target/config-service-1.0.0.jar"
echo "================================================"
