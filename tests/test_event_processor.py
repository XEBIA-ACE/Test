"""Tests for the EventProcessor domain service."""

from __future__ import annotations

from app.domain.models import Event, EventType, NotificationChannel
from app.domain.services import EventProcessor


class TestEventProcessor:
    def setup_method(self) -> None:
        self.processor = EventProcessor()

    def _make_event(self, event_type: EventType, payload: dict | None = None) -> Event:
        return Event(
            event_type=event_type,
            payload=payload or {},
            source="test",
        )

    def test_project_created_triggers_provision_action(self) -> None:
        event = self._make_event(
            EventType.PROJECT_CREATED, {"project_id": "p1", "owner_email": "a@b.com"}
        )
        actions, _ = self.processor.process(event)
        assert any(a.action_type == "provision_resources" for a in actions)

    def test_project_deleted_triggers_deprovision_action(self) -> None:
        event = self._make_event(
            EventType.PROJECT_DELETED, {"project_id": "p1", "owner_email": "a@b.com"}
        )
        actions, _ = self.processor.process(event)
        assert any(a.action_type == "deprovision_resources" for a in actions)

    def test_task_completed_triggers_update_progress_action(self) -> None:
        event = self._make_event(
            EventType.TASK_COMPLETED,
            {"task_id": "t1", "project_id": "p1", "owner_email": "a@b.com"},
        )
        actions, _ = self.processor.process(event)
        assert any(a.action_type == "update_project_progress" for a in actions)

    def test_project_created_sends_email_notification(self) -> None:
        event = self._make_event(
            EventType.PROJECT_CREATED, {"project_id": "p1", "owner_email": "a@b.com"}
        )
        _, notifications = self.processor.process(event)
        assert any(n.channel == NotificationChannel.EMAIL for n in notifications)

    def test_generic_event_produces_no_actions(self) -> None:
        event = self._make_event(EventType.GENERIC)
        actions, _ = self.processor.process(event)
        assert actions == []

    def test_generic_event_produces_no_notifications(self) -> None:
        event = self._make_event(EventType.GENERIC)
        _, notifications = self.processor.process(event)
        assert notifications == []
