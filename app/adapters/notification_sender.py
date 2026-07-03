"""Notification sender adapters (outbound)."""

from __future__ import annotations

import logging
from typing import Optional

from app.domain.models import Notification, NotificationChannel
from app.ports.outbound import NotificationSenderPort

logger = logging.getLogger(__name__)


class LoggingNotificationSender(NotificationSenderPort):
    """
    Stub notification sender that logs notifications instead of
    delivering them.  Useful for local development and testing.
    """

    def send(self, notification: Notification) -> None:
        logger.info(
            "NOTIFICATION [%s] → %s | %s",
            notification.channel.value,
            notification.recipient,
            notification.subject,
        )


class EmailNotificationSender(NotificationSenderPort):
    """
    SMTP-based email notification sender.

    TODO: Replace stub implementation with a real SMTP / SES client.
    """

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        sender_address: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ) -> None:
        self._smtp_host = smtp_host
        self._smtp_port = smtp_port
        self._sender_address = sender_address
        self._username = username
        self._password = password

    def send(self, notification: Notification) -> None:
        if notification.channel != NotificationChannel.EMAIL:
            logger.warning(
                "EmailNotificationSender received non-email notification; skipping."
            )
            return

        # TODO: implement real SMTP delivery
        logger.info(
            "Sending email to '%s' with subject '%s' via %s:%s",
            notification.recipient,
            notification.subject,
            self._smtp_host,
            self._smtp_port,
        )
