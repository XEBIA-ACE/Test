"""Kafka consumer adapter (inbound)."""

from __future__ import annotations

import json
import logging
import threading
from typing import Callable, Optional

from app.domain.models import Event, EventType
from app.ports.inbound import EventConsumerPort

logger = logging.getLogger(__name__)


class KafkaConsumerAdapter(EventConsumerPort):
    """
    Consumes messages from a Kafka topic and converts them to
    :class:`~app.domain.models.Event` objects.

    The actual ``kafka-python`` import is deferred so the service can
    start (and tests can run) without a live broker.
    """

    def __init__(
        self,
        bootstrap_servers: str,
        topic: str,
        group_id: str,
        on_event: Callable[[Event], None],
    ) -> None:
        self._bootstrap_servers = bootstrap_servers
        self._topic = topic
        self._group_id = group_id
        self._on_event = on_event
        self._consumer: Optional[object] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False

    # ------------------------------------------------------------------
    # EventConsumerPort
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Start consuming in a background thread."""
        try:
            from kafka import KafkaConsumer  # type: ignore[import]
        except ImportError:
            logger.warning(
                "kafka-python not installed — Kafka consumer will not start."
            )
            return

        self._consumer = KafkaConsumer(
            self._topic,
            bootstrap_servers=self._bootstrap_servers,
            group_id=self._group_id,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="earliest",
            enable_auto_commit=True,
        )
        self._running = True
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()
        logger.info("Kafka consumer started on topic '%s'.", self._topic)

    def stop(self) -> None:
        self._running = False
        if self._consumer:
            self._consumer.close()  # type: ignore[attr-defined]
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("Kafka consumer stopped.")

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _poll_loop(self) -> None:
        while self._running:
            try:
                for message in self._consumer:  # type: ignore[union-attr]
                    if not self._running:
                        break
                    event = self._deserialize(message.value)
                    if event:
                        self._on_event(event)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("Kafka poll error: %s", exc, exc_info=True)

    @staticmethod
    def _deserialize(data: dict) -> Optional[Event]:
        try:
            return Event(
                event_type=EventType(data.get("event_type", EventType.GENERIC)),
                payload=data.get("payload", {}),
                source=data.get("source", "kafka"),
                event_id=data.get("event_id", ""),
                correlation_id=data.get("correlation_id"),
            )
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("Failed to deserialize Kafka message: %s", exc)
            return None
