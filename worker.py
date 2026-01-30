#!/usr/bin/env python3
"""
Celery worker entry point for Claude Code Wrapper.

Usage:
    # Start worker with default settings
    celery -A worker worker --loglevel=info

    # Start with specific concurrency
    celery -A worker worker --loglevel=info --concurrency=2

    # Start with specific queue
    celery -A worker worker --loglevel=info -Q claude_scaffold_high

    # macOS: Use solo pool (fork issues)
    celery -A worker worker --loglevel=info -P solo
"""

import logging
import os
import sys

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s: %(levelname)s/%(name)s] %(message)s',
)
logger = logging.getLogger(__name__)


def main():
    """Initialize and return Celery app for worker."""
    logger.info("=" * 60)
    logger.info("Starting Claude Code Wrapper Celery Worker")
    logger.info("=" * 60)

    # Import and register tasks
    from src.celery_app import app
    import src.tasks.scaffold_tasks  # noqa: F401 - registers tasks

    # Log registered tasks
    registered_tasks = [t for t in app.tasks.keys() if not t.startswith('celery.')]
    logger.info(f"Registered tasks: {registered_tasks}")

    # Log configuration
    logger.info(f"Broker: {app.conf.broker_url}")
    logger.info(f"Backend: {app.conf.result_backend}")
    logger.info(f"Default queue: {app.conf.task_default_queue}")

    return app


# Create the Celery app instance for worker
app = main()


if __name__ == "__main__":
    print("""
    Claude Code Wrapper - Celery Worker
    ====================================

    Start worker with one of these commands:

    # Default (Linux)
    celery -A worker worker --loglevel=info --concurrency=2

    # macOS (use solo pool to avoid fork issues)
    celery -A worker worker --loglevel=info -P solo

    # With specific queue
    celery -A worker worker --loglevel=info -Q claude_scaffold_high

    # Multiple workers (for parallelism)
    celery -A worker worker --loglevel=info --concurrency=2 &
    celery -A worker worker --loglevel=info --concurrency=2 &
    """)
