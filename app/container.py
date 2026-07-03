"""Dependency-injection container / service wiring."""

from __future__ import annotations

from app.adapters.action_dispatcher import HttpActionDispatcher, LoggingActionDispatcher
from app.adapters.notification_sender import (
    EmailNotificationSender,
    LoggingNotificationSender,
)
from app.application.use_cases import HandleEventUseCase
from app.config import Settings
from app.domain.services import EventProcessor


def build_handle_event_use_case(settings: Settings) -> HandleEventUseCase:
    """Wire up and return the primary use-case."""
    processor = EventProcessor()

    if settings.smtp_host and settings.smtp_username:
        notification_sender = EmailNotificationSender(
            smtp_host=settings.smtp_host,
            smtp_port=settings.smtp_port,
            sender_address=settings.smtp_sender_address,
            username=settings.smtp_username,
            password=settings.smtp_password,
        )
    else:
        notification_sender = LoggingNotificationSender()

    if settings.action_dispatcher_base_url:
        action_dispatcher = HttpActionDispatcher(
            base_url=settings.action_dispatcher_base_url,
            timeout=settings.action_dispatcher_timeout,
        )
    else:
        action_dispatcher = LoggingActionDispatcher()

    return HandleEventUseCase(
        event_processor=processor,
        action_dispatcher=action_dispatcher,
        notification_sender=notification_sender,
    )
