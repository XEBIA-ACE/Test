#!/bin/bash

# API Testing Script
# Quick smoke tests for the Integration Service API

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "=========================================="
echo "Integration Service API Tests"
echo "=========================================="
echo "Testing API at: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5

    echo -n "Testing: $description... "

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "1. Health Check Tests"
echo "----------------------"
test_endpoint "GET" "/health" 200 "Health check endpoint"
test_endpoint "GET" "/live" 200 "Liveness check endpoint"
test_endpoint "GET" "/ready" 200 "Readiness check endpoint" || true # May fail if dependencies not ready
echo ""

echo "2. API Documentation"
echo "--------------------"
test_endpoint "GET" "/api-docs" 200 "Swagger documentation" || true
test_endpoint "GET" "/" 200 "Root endpoint"
echo ""

echo "3. Integration Endpoints"
echo "------------------------"

# Create integration
CREATE_PAYLOAD='{
  "sourceSystem": "TEST_CRM",
  "targetSystem": "TEST_ERP",
  "operation": "testOperation",
  "payload": {
    "testData": "sample",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }
}'

echo "Creating test integration..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD" \
    "$API_URL/api/v1/integrations")

INTEGRATION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$INTEGRATION_ID" ]; then
    echo -e "${GREEN}✓ Integration created${NC} (ID: $INTEGRATION_ID)"
    ((PASSED++))

    # Get integration by ID
    test_endpoint "GET" "/api/v1/integrations/$INTEGRATION_ID" 200 "Get integration by ID"

    # List integrations
    test_endpoint "GET" "/api/v1/integrations" 200 "List all integrations"

    # List with filters
    test_endpoint "GET" "/api/v1/integrations?sourceSystem=TEST_CRM&limit=10" 200 "List with filters"
else
    echo -e "${RED}✗ Failed to create integration${NC}"
    echo "Response: $CREATE_RESPONSE"
    ((FAILED++))
fi
echo ""

echo "4. Error Handling Tests"
echo "-----------------------"
test_endpoint "GET" "/api/v1/integrations/00000000-0000-0000-0000-000000000000" 404 "Non-existent integration" || true
test_endpoint "GET" "/invalid-route" 404 "Invalid route"

# Test invalid payload
INVALID_PAYLOAD='{"sourceSystem": ""}'
test_endpoint "POST" "/api/v1/integrations" 400 "Invalid integration payload" "$INVALID_PAYLOAD" || true
echo ""

echo "5. Metrics Endpoint"
echo "-------------------"
test_endpoint "GET" "/metrics" 200 "Prometheus metrics" || true
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}"
    exit 1
fi
