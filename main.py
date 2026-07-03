"""Service entrypoint — starts the HTTP server and message consumers."""

from __future__ import annotations

import logging
import signal
import sys
from typing import List

import uvicorn

from app.adapters.kafka_consumer import KafkaConsumerAdapter
from app.adapters.rabbitmq_consumer import RabbitMQConsumerAdapter
from app.api.app import create_app
from app.config import get_settings
from app.container import build_handle_event_use_case
from app.ports.inbound import EventConsumerPort

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    settings = get_settings()
    logging.getLogger().setLevel(settings.log_level.upper())

    use_case = build_handle_event_use_case(settings)

    consumers: List[EventConsumerPort] = []

    if settings.kafka_enabled:
        for topic in settings.kafka_topics:
            consumers.append(
                KafkaConsumerAdapter(
                    bootstrap_servers=settings.kafka_bootstrap_servers,
                    topic=topic,
                    group_id=settings.kafka_consumer_group_id,
                    on_event=use_case.handle,
                )
            )

    if settings.rabbitmq_enabled:
        consumers.append(
            RabbitMQConsumerAdapter(
                amqp_url=settings.rabbitmq_url,
                queue_name=settings.rabbitmq_queue,
                on_event=use_case.handle,
            )
        )

    for consumer in consumers:
        consumer.start()

    def _shutdown(signum: int, frame: object) -> None:  # noqa: ARG001
        logger.info("Shutdown signal received — stopping consumers…")
        for c in consumers:
            c.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    app = create_app()
    uvicorn.run(app, host=settings.host, port=settings.port)


if __name__ == "__main__":
    main()
