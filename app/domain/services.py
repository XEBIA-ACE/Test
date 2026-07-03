"""Domain service — core event processing logic."""

from __future__ import annotations

import logging
from typing import List

from app.domain.models import Action, Event, EventType, Notification, NotificationChannel

logger = logging.getLogger(__name__)


class EventProcessor:
    """
    Pure domain service that decides which actions and notifications
    should be triggered for a given event.

    No I/O happens here — callers are responsible for dispatching the
    returned Action / Notification objects via the appropriate ports.
    """

    def process(self, event: Event) -> tuple[List[Action], List[Notification]]:
        """
        Derive actions and notifications from *event*.

        Returns
        -------
        actions:
            Zero or more :class:`Action` objects to execute.
        notifications:
            Zero or more :class:`Notification` objects to send.
        """
        logger.info(
            "Processing event",
            extra={"event_id": event.event_id, "event_type": event.event_type},
        )

        actions: List[Action] = self._derive_actions(event)
        notifications: List[Notification] = self._derive_notifications(event)

        return actions, notifications

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _derive_actions(self, event: Event) -> List[Action]:
        actions: List[Action] = []

        if event.event_type == EventType.PROJECT_CREATED:
            actions.append(
                Action(
                    action_type="provision_resources",
                    target="resource_manager",
                    parameters={"project_id": event.payload.get("project_id")},
                )
            )
        elif event.event_type == EventType.PROJECT_DELETED:
            actions.append(
                Action(
                    action_type="deprovision_resources",
                    target="resource_manager",
                    parameters={"project_id": event.payload.get("project_id")},
                )
            )
        elif event.event_type == EventType.TASK_COMPLETED:
            actions.append(
                Action(
                    action_type="update_project_progress",
                    target="project_service",
                    parameters={
                        "task_id": event.payload.get("task_id"),
                        "project_id": event.payload.get("project_id"),
                    },
                )
            )

        return actions

    def _derive_notifications(self, event: Event) -> List[Notification]:
        notifications: List[Notification] = []

        if event.event_type in (
            EventType.PROJECT_CREATED,
            EventType.PROJECT_DELETED,
            EventType.TASK_COMPLETED,
        ):
            recipient = event.payload.get("owner_email", "team@example.com")
            notifications.append(
                Notification(
                    channel=NotificationChannel.EMAIL,
                    recipient=recipient,
                    subject=f"[Event] {event.event_type.value}",
                    body=(
                        f"Event '{event.event_type.value}' occurred at "
                        f"{event.occurred_at.isoformat()}.\n\n"
                        f"Payload: {event.payload}"
                    ),
                )
            )

        return notifications
