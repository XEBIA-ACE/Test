#!/bin/bash
# ============================================================================
# Health Check Script
# ============================================================================

HOST=${1:-localhost}
PORT=${2:-8888}
USERNAME=${3:-admin}
PASSWORD=${4:-admin123}

echo "Checking health of Config Service at ${HOST}:${PORT}..."
echo ""

# Public health endpoint
echo "1. Public Health Endpoint:"
curl -s http://${HOST}:${PORT}/actuator/health | jq '.'
echo ""

# Authenticated config health endpoint
echo "2. Config Sources Health (requires auth):"
curl -s -u ${USERNAME}:${PASSWORD} http://${HOST}:${PORT}/api/v1/config/health | jq '.'
echo ""

# Check if service is ready
STATUS=$(curl -s http://${HOST}:${PORT}/actuator/health | jq -r '.status')

if [ "$STATUS" == "UP" ]; then
    echo "✓ Service is healthy!"
    exit 0
else
    echo "✗ Service is not healthy. Status: $STATUS"
    exit 1
fi
