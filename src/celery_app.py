"""
Celery application configuration for Claude Code Wrapper Service.

This module provides Celery configuration for distributed scaffolding execution
across multiple workers. Uses Redis as both broker and result backend.
"""

import logging
import os


from celery import Celery
from celery.signals import after_setup_logger

logger = logging.getLogger(__name__)

# Try to import cluster-compatible URL helper
try:
    from x_sdlc_core.utils.redis_utils import get_cluster_compatible_redis_url
except ImportError:

    def get_cluster_compatible_redis_url(url: str) -> str:
        """Fallback - return URL as-is if x_sdlc_core not available."""
        return url


def get_redis_url() -> str:
    """
    Get Redis URL with cluster compatibility.

    Priority: REDIS_URL env var > default localhost
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/3")
    return get_cluster_compatible_redis_url(redis_url)


def create_celery_app() -> Celery:
    """
    Create and configure Celery application for Claude Code Wrapper.

    Returns:
        Configured Celery application
    """
    redis_url = get_redis_url()
    logger.info(f"Celery using Redis: {redis_url}")

    app = Celery(
        "claude-code-wrapper",
        broker=redis_url,
        backend=redis_url,
        include=[
            "src.tasks.scaffold_tasks",
        ],
    )

    app.conf.update(
        # Broker and backend settings
        result_backend=redis_url,
        broker_connection_retry_on_startup=True,
        broker_connection_retry=True,
        broker_connection_max_retries=10,
        broker_connection_retry_delay=5.0,
        broker_connection_max_retry_delay=60.0,
        broker_connection_retry_backoff=2.0,
        broker_connection_retry_jitter=True,
        # Task execution settings
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        task_track_started=True,
        task_store_eager_result=True,
        task_ignore_result=False,
        task_default_retry_delay=60,
        task_max_retries=3,
        # Task time limits (scaffolding can take a while)
        task_soft_time_limit=1800,  # 30 minutes soft limit
        task_time_limit=2400,  # 40 minutes hard limit
        # Worker settings
        worker_prefetch_multiplier=1,  # One task at a time per worker
        worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (memory cleanup)
        worker_disable_rate_limits=True,
        worker_cancel_long_running_tasks_on_connection_loss=True,
        # Result settings
        result_expires=3600,  # 1 hour
        # Serialization
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        # Logging
        worker_log_format="[%(asctime)s: %(levelname)s/%(processName)s] %(message)s",
        worker_task_log_format="[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s",
        # Redis backend options
        result_backend_transport_options={
            "socket_connect_timeout": 5,
            "socket_timeout": 5,
            "retry_on_timeout": True,
            "health_check_interval": 30,
        },
        # Use default celery queue for simplicity
        task_default_queue="celery",
    )

    return app


# Create the Celery application instance
app = create_celery_app()


@after_setup_logger.connect
def setup_celery_loggers(logger, **kwargs):
    """
    Set log levels for Celery and its dependencies to reduce verbosity.
    """
    logging.getLogger("kombu").setLevel(logging.WARNING)
    logging.getLogger("kombu.transport.redis").setLevel(logging.ERROR)
    logging.getLogger("celery").setLevel(logging.INFO)
    logging.getLogger("redis").setLevel(logging.ERROR)


# Export the Celery app
__all__ = ["app", "create_celery_app"]
