"""RabbitMQ consumer adapter (inbound)."""

from __future__ import annotations

import json
import logging
import threading
from typing import Callable, Optional

from app.domain.models import Event, EventType
from app.ports.inbound import EventConsumerPort

logger = logging.getLogger(__name__)


class RabbitMQConsumerAdapter(EventConsumerPort):
    """
    Consumes messages from a RabbitMQ queue and converts them to
    :class:`~app.domain.models.Event` objects.

    The actual ``pika`` import is deferred so the service can start
    (and tests can run) without a live broker.
    """

    def __init__(
        self,
        amqp_url: str,
        queue_name: str,
        on_event: Callable[[Event], None],
    ) -> None:
        self._amqp_url = amqp_url
        self._queue_name = queue_name
        self._on_event = on_event
        self._connection: Optional[object] = None
        self._channel: Optional[object] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False

    # ------------------------------------------------------------------
    # EventConsumerPort
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Start consuming in a background thread."""
        try:
            import pika  # type: ignore[import]
        except ImportError:
            logger.warning(
                "pika not installed — RabbitMQ consumer will not start."
            )
            return

        params = pika.URLParameters(self._amqp_url)
        self._connection = pika.BlockingConnection(params)
        self._channel = self._connection.channel()  # type: ignore[union-attr]
        self._channel.queue_declare(queue=self._queue_name, durable=True)  # type: ignore[union-attr]
        self._channel.basic_consume(  # type: ignore[union-attr]
            queue=self._queue_name,
            on_message_callback=self._on_message,
            auto_ack=False,
        )
        self._running = True
        self._thread = threading.Thread(target=self._consume_loop, daemon=True)
        self._thread.start()
        logger.info(
            "RabbitMQ consumer started on queue '%s'.", self._queue_name
        )

    def stop(self) -> None:
        self._running = False
        if self._channel:
            try:
                self._channel.stop_consuming()  # type: ignore[union-attr]
            except Exception:  # pylint: disable=broad-except
                pass
        if self._connection:
            try:
                self._connection.close()  # type: ignore[union-attr]
            except Exception:  # pylint: disable=broad-except
                pass
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("RabbitMQ consumer stopped.")

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _consume_loop(self) -> None:
        try:
            self._channel.start_consuming()  # type: ignore[union-attr]
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("RabbitMQ consume error: %s", exc, exc_info=True)

    def _on_message(
        self,
        channel: object,
        method: object,
        properties: object,
        body: bytes,
    ) -> None:
        try:
            data = json.loads(body.decode("utf-8"))
            event = self._deserialize(data)
            if event:
                self._on_event(event)
            channel.basic_ack(delivery_tag=method.delivery_tag)  # type: ignore[union-attr]
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("Failed to process RabbitMQ message: %s", exc, exc_info=True)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # type: ignore[union-attr]

    @staticmethod
    def _deserialize(data: dict) -> Optional[Event]:
        try:
            return Event(
                event_type=EventType(data.get("event_type", EventType.GENERIC)),
                payload=data.get("payload", {}),
                source=data.get("source", "rabbitmq"),
                event_id=data.get("event_id", ""),
                correlation_id=data.get("correlation_id"),
            )
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("Failed to deserialize RabbitMQ message: %s", exc)
            return None
