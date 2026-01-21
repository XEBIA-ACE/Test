#!/bin/bash

# Setup script for Keycloak configuration
# This script creates the realm and client needed for the authentication service

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8180}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
REALM_NAME="${REALM_NAME:-authentication-service}"
CLIENT_ID="${CLIENT_ID:-auth-service-client}"

echo "Setting up Keycloak..."
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM_NAME"
echo "Client: $CLIENT_ID"

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
max_retries=30
retry_count=0
until curl -sf "$KEYCLOAK_URL/health/ready" > /dev/null || [ $retry_count -eq $max_retries ]; do
  echo "Waiting for Keycloak... ($retry_count/$max_retries)"
  sleep 5
  retry_count=$((retry_count + 1))
done

if [ $retry_count -eq $max_retries ]; then
  echo "Error: Keycloak did not become ready in time"
  exit 1
fi

echo "Keycloak is ready!"

# Get admin access token
echo "Getting admin access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to get access token"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "Access token obtained successfully"

# Create realm
echo "Creating realm: $REALM_NAME"
curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'"$REALM_NAME"'",
    "enabled": true,
    "sslRequired": "none",
    "registrationAllowed": true,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true
  }'

echo "Realm created successfully"

# Create client
echo "Creating client: $CLIENT_ID"
curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'"$CLIENT_ID"'",
    "enabled": true,
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": true,
    "authorizationServicesEnabled": false,
    "redirectUris": ["http://localhost:8080/*"],
    "webOrigins": ["*"],
    "attributes": {
      "access.token.lifespan": "3600",
      "client.secret.creation.time": "0"
    }
  }'

echo "Client created successfully"

# Get client UUID
CLIENT_UUID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_UUID" ]; then
  echo "Error: Failed to get client UUID"
  exit 1
fi

echo "Client UUID: $CLIENT_UUID"

# Get client secret
CLIENT_SECRET=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID/client-secret" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"value":"[^"]*' | cut -d'"' -f4)

if [ -z "$CLIENT_SECRET" ]; then
  echo "Error: Failed to get client secret"
  exit 1
fi

echo ""
echo "=========================================="
echo "Keycloak Setup Complete!"
echo "=========================================="
echo "Realm: $REALM_NAME"
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo ""
echo "Add this to your .env file:"
echo "KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET"
echo "=========================================="
