"""Tests for domain models."""

from __future__ import annotations

import pytest

from app.domain.models import Action, Event, EventType, Notification, NotificationChannel


class TestEvent:
    def test_event_creation_with_defaults(self) -> None:
        event = Event(
            event_type=EventType.PROJECT_CREATED,
            payload={"project_id": "abc"},
            source="test",
        )
        assert event.event_type == EventType.PROJECT_CREATED
        assert event.payload == {"project_id": "abc"}
        assert event.source == "test"
        assert event.event_id  # auto-generated UUID

    def test_event_raises_on_empty_source(self) -> None:
        with pytest.raises(ValueError, match="source"):
            Event(
                event_type=EventType.GENERIC,
                payload={},
                source="",
            )

    def test_event_raises_on_non_dict_payload(self) -> None:
        with pytest.raises(TypeError, match="payload"):
            Event(
                event_type=EventType.GENERIC,
                payload="not-a-dict",  # type: ignore[arg-type]
                source="test",
            )


class TestAction:
    def test_action_creation(self) -> None:
        action = Action(action_type="do_something", target="service_x")
        assert action.action_type == "do_something"
        assert action.target == "service_x"
        assert action.parameters == {}
        assert action.action_id


class TestNotification:
    def test_notification_creation(self) -> None:
        notif = Notification(
            channel=NotificationChannel.EMAIL,
            recipient="user@example.com",
            subject="Hello",
            body="World",
        )
        assert notif.channel == NotificationChannel.EMAIL
        assert notif.recipient == "user@example.com"
        assert notif.notification_id
