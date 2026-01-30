# Dockerfile for Claude Code Wrapper Celery Worker
# 
# MIGRATION NOTE: This service has been migrated from FastAPI to Celery-only.
# The FastAPI layer (main.py, cwapi/) is deprecated. ACE-API now communicates
# directly with this worker via Celery/Redis.
#
# Architecture: ACE-API -> Celery (Redis) -> This Worker

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (combined - only run apt-get once)
RUN apt-get update && apt-get install -y \
    gcc g++ git curl wget make ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x (needed for Claude Agent SDK)
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy internal packages
COPY packages/x-sdlc-core/ /tmp/packages/x-sdlc-core/
COPY packages/x-sdlc-observability/ /tmp/packages/x-sdlc-observability/

# Install internal packages in correct order
RUN pip install --no-cache-dir /tmp/packages/x-sdlc-core/ && \
    pip install --no-cache-dir "/tmp/packages/x-sdlc-observability/[all]" && \
    rm -rf /tmp/packages/

# Copy application code
COPY services/claude-code-wrapper/ .

# Remove deprecated FastAPI files (optional cleanup)
RUN rm -f env.example

# Fix permissions
RUN find /app -type d -exec chmod +x {} + && \
    chmod -R +r /app

RUN pip install --no-cache-dir ".[all-cloud-storage]"

# Ensure paths are set
ENV PATH="/usr/local/bin:$PATH"

# Create temp directory for scaffolding
RUN mkdir -p /tmp/claude-scaffold

# No port exposure needed - this is a Celery worker, not a web server
# EXPOSE 8080  # REMOVED - not needed for Celery worker

# Health check via Celery inspect (checks if worker is responsive)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD celery -A worker inspect ping -d celery@$HOSTNAME || exit 1

# Run Celery worker instead of FastAPI
# - Uses solo pool for compatibility (avoids fork issues)
# - Listens on default 'celery' queue
# - Concurrency of 2 for parallel task execution
CMD ["celery", "-A", "worker", "worker", "--loglevel=info", "--pool=solo", "--concurrency=2"]
