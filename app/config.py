"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration values for the Event Processing Service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Service ──────────────────────────────────────────────────────────
    service_name: str = "event-processing-service"
    service_version: str = "0.1.0"
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000

    # ── Kafka ─────────────────────────────────────────────────────────────
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group_id: str = "event-processing-service"
    kafka_topics: List[str] = ["project-events"]
    kafka_auto_offset_reset: str = "earliest"
    kafka_enabled: bool = True

    # ── RabbitMQ ──────────────────────────────────────────────────────────
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    rabbitmq_exchange: str = "project_events"
    rabbitmq_queue: str = "event-processing-service"
    rabbitmq_routing_key: str = "#"
    rabbitmq_enabled: bool = False

    # ── Notifications ─────────────────────────────────────────────────────
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_sender_address: str = "noreply@example.com"
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None

    # ── Actions ───────────────────────────────────────────────────────────
    action_dispatcher_base_url: str = "http://localhost:8080"
    action_dispatcher_timeout: int = 10


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached application settings."""
    return Settings()
