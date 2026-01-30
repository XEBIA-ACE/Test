#!/bin/bash
# Start script for Claude Code Wrapper Service

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Anthropic API key is set (support both names)
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -z "${CLAUDE_API_KEY:-}" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY or CLAUDE_API_KEY not set."
    echo "   Service will start but SDK operations will fail."
    echo "   Set ANTHROPIC_API_KEY (preferred) or CLAUDE_API_KEY in .env file or environment variables."
    echo "   Get your API key from: https://console.anthropic.com/"
fi

# Create temp directory if it doesn't exist
TEMP_DIR="${EC2_TEMP_DIR:-/tmp/claude-scaffold}"
mkdir -p "$TEMP_DIR"
echo "📁 Using temp directory: $TEMP_DIR"

# Get configuration
HOST="${EC2_SERVICE_HOST:-0.0.0.0}"
PORT="${EC2_SERVICE_PORT:-8080}"
WORKERS="${EC2_SERVICE_WORKERS:-1}"

echo "🚀 Starting Claude Code Wrapper Service..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Workers: $WORKERS"

# Start the service
python main.py

