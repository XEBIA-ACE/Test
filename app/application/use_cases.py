"""Application use-case: handle an inbound event end-to-end."""

from __future__ import annotations

import logging

from app.domain.models import Event
from app.domain.services import EventProcessor
from app.ports.inbound import EventHandlerPort
from app.ports.outbound import ActionDispatcherPort, NotificationSenderPort

logger = logging.getLogger(__name__)


class HandleEventUseCase(EventHandlerPort):
    """
    Orchestrates the full lifecycle of a single event:

    1. Delegate to the domain :class:`EventProcessor` to derive actions
       and notifications.
    2. Dispatch each action via the :class:`ActionDispatcherPort`.
    3. Send each notification via the :class:`NotificationSenderPort`.
    """

    def __init__(
        self,
        event_processor: EventProcessor,
        action_dispatcher: ActionDispatcherPort,
        notification_sender: NotificationSenderPort,
    ) -> None:
        self._processor = event_processor
        self._action_dispatcher = action_dispatcher
        self._notification_sender = notification_sender

    def handle(self, event: Event) -> None:
        logger.info("Handling event '%s' (id=%s)", event.event_type, event.event_id)

        actions, notifications = self._processor.process(event)

        for action in actions:
            try:
                self._action_dispatcher.dispatch(action)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Failed to dispatch action '%s': %s",
                    action.action_type,
                    exc,
                    exc_info=True,
                )

        for notification in notifications:
            try:
                self._notification_sender.send(notification)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Failed to send notification to '%s': %s",
                    notification.recipient,
                    exc,
                    exc_info=True,
                )
