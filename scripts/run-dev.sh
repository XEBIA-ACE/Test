#!/bin/bash
# ============================================================================
# Run in Development Mode
# ============================================================================

set -e

echo "Starting Configuration Service in development mode..."

# Set development profile
export SPRING_PROFILES_ACTIVE=dev

# Run with Maven
mvn spring-boot:run -Dspring-boot.run.profiles=dev
