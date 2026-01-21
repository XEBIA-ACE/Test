#!/bin/bash

# API testing script
# Tests the authentication service endpoints

set -e

API_URL="${API_URL:-http://localhost:8080}"
BASE_URL="$API_URL/api/v1"

echo "Testing Authentication Service API"
echo "API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$HEALTH_STATUS" = "UP" ]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  echo "$HEALTH_RESPONSE"
  exit 1
fi
echo ""

# Test user registration
echo "2. Testing user registration..."
TIMESTAMP=$(date +%s)
USERNAME="testuser$TIMESTAMP"
EMAIL="test$TIMESTAMP@example.com"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$USERNAME"'",
    "email": "'"$EMAIL"'",
    "password": "SecureP@ssw0rd123",
    "firstName": "Test",
    "lastName": "User"
  }')

REGISTERED_USERNAME=$(echo "$REGISTER_RESPONSE" | grep -o '"username":"[^"]*' | cut -d'"' -f4)

if [ "$REGISTERED_USERNAME" = "$USERNAME" ]; then
  echo -e "${GREEN}✓ User registration successful${NC}"
else
  echo -e "${RED}✗ User registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi
echo ""

# Test user login
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$USERNAME"'",
    "password": "SecureP@ssw0rd123"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
  echo -e "${GREEN}✓ User login successful${NC}"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
  echo -e "${RED}✗ User login failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test token refresh
echo "4. Testing token refresh..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'"$REFRESH_TOKEN"'"
  }')

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$NEW_ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Token refresh successful${NC}"
  echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Token refresh failed${NC}"
  echo "$REFRESH_RESPONSE"
  exit 1
fi
echo ""

# Test protected endpoint
echo "5. Testing protected endpoint (get current user)..."
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

USER_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me?userId=$USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

USER_USERNAME=$(echo "$USER_RESPONSE" | grep -o '"username":"[^"]*' | cut -d'"' -f4)

if [ "$USER_USERNAME" = "$USERNAME" ]; then
  echo -e "${GREEN}✓ Protected endpoint access successful${NC}"
else
  echo -e "${RED}✗ Protected endpoint access failed${NC}"
  echo "$USER_RESPONSE"
  exit 1
fi
echo ""

# Test invalid credentials
echo "6. Testing invalid credentials..."
INVALID_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$USERNAME"'",
    "password": "WrongPassword"
  }')

HTTP_CODE=$(echo "$INVALID_LOGIN" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Invalid credentials properly rejected${NC}"
else
  echo -e "${RED}✗ Invalid credentials test failed${NC}"
  echo "$INVALID_LOGIN"
  exit 1
fi
echo ""

echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
