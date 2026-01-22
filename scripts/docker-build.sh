#!/bin/bash
# ============================================================================
# Docker Build Script
# ============================================================================

set -e

VERSION=${1:-1.0.0}
IMAGE_NAME="config-service"

echo "================================================"
echo "Building Docker image: ${IMAGE_NAME}:${VERSION}"
echo "================================================"

# Build the image
docker build -t ${IMAGE_NAME}:${VERSION} .

# Tag as latest
docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest

echo "================================================"
echo "Docker image built successfully!"
echo "Image: ${IMAGE_NAME}:${VERSION}"
echo "================================================"
echo ""
echo "To run the container:"
echo "  docker run -d -p 8888:8888 --name config-service ${IMAGE_NAME}:${VERSION}"
