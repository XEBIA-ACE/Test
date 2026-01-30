#!/bin/bash
# Build script for Claude Code Wrapper Docker image with retry logic

set -e

# Configuration
IMAGE_NAME="ace-agents-claude-code-wrapper"
DOCKERFILE="Dockerfile"
MAX_RETRIES=3
RETRY_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build Docker image with retries
build_with_retry() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        print_status "Build attempt $attempt of $MAX_RETRIES..."
        
        if docker build \
            --build-arg BUILDKIT_INLINE_CACHE=1 \
            --progress=plain \
            --no-cache \
            -t $IMAGE_NAME \
            -f $DOCKERFILE \
            ../../.; then
            print_status "Build successful on attempt $attempt!"
            return 0
        else
            print_warning "Build failed on attempt $attempt"
            if [ $attempt -lt $MAX_RETRIES ]; then
                print_status "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
        
        ((attempt++))
    done
    
    print_error "Build failed after $MAX_RETRIES attempts"
    return 1
}

# Function to test the built image
test_image() {
    print_status "Testing the built image..."
    
    # Start container in background
    CONTAINER_ID=$(docker run -d -p 8081:8080 --env ANTHROPIC_API_KEY="test" $IMAGE_NAME)
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:8081/health > /dev/null 2>&1; then
        print_status "Health check passed!"
        docker stop $CONTAINER_ID > /dev/null
        docker rm $CONTAINER_ID > /dev/null
        return 0
    else
        print_error "Health check failed!"
        docker logs $CONTAINER_ID
        docker stop $CONTAINER_ID > /dev/null
        docker rm $CONTAINER_ID > /dev/null
        return 1
    fi
}

# Main execution
main() {
    print_status "Starting Claude Code Wrapper Docker build..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [ ! -f "$DOCKERFILE" ]; then
        print_error "Dockerfile not found: $DOCKERFILE"
        exit 1
    fi
    
    # Build the image
    if build_with_retry; then
        print_status "Docker image built successfully: $IMAGE_NAME"
        
        # Test the image if requested
        if [ "$1" = "--test" ]; then
            if test_image; then
                print_status "Image test passed!"
            else
                print_error "Image test failed!"
                exit 1
            fi
        fi
        
        print_status "Build completed successfully!"
        echo
        echo "To run the container:"
        echo "  docker run -p 8080:8080 --env ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY $IMAGE_NAME"
        echo
        echo "To use with docker-compose:"
        echo "  docker-compose -f ../../docker-compose.yml -f ../../docker-compose.claude-wrapper.yml up claude-code-wrapper"
        
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [--test] [--help]"
    echo
    echo "Options:"
    echo "  --test    Test the built image after building"
    echo "  --help    Show this help message"
    echo
    echo "Environment variables:"
    echo "  ANTHROPIC_API_KEY    Required for testing the image"
    exit 0
fi

# Run main function
main "$@"