"""Tests for the HandleEventUseCase."""

from __future__ import annotations

from unittest.mock import MagicMock, call

import pytest

from app.application.use_cases import HandleEventUseCase
from app.domain.models import (
    Action,
    Event,
    EventType,
    Notification,
    NotificationChannel,
)
from app.domain.services import EventProcessor
from app.ports.outbound import ActionDispatcherPort, NotificationSenderPort


class TestHandleEventUseCase:
    def setup_method(self) -> None:
        self.processor = EventProcessor()
        self.dispatcher = MagicMock(spec=ActionDispatcherPort)
        self.sender = MagicMock(spec=NotificationSenderPort)
        self.use_case = HandleEventUseCase(
            event_processor=self.processor,
            action_dispatcher=self.dispatcher,
            notification_sender=self.sender,
        )

    def _make_event(self, event_type: EventType) -> Event:
        return Event(
            event_type=event_type,
            payload={"project_id": "p1", "owner_email": "x@y.com"},
            source="test",
        )

    def test_handle_dispatches_actions(self) -> None:
        event = self._make_event(EventType.PROJECT_CREATED)
        self.use_case.handle(event)
        assert self.dispatcher.dispatch.called

    def test_handle_sends_notifications(self) -> None:
        event = self._make_event(EventType.PROJECT_CREATED)
        self.use_case.handle(event)
        assert self.sender.send.called

    def test_handle_generic_event_no_dispatch(self) -> None:
        event = self._make_event(EventType.GENERIC)
        self.use_case.handle(event)
        self.dispatcher.dispatch.assert_not_called()
        self.sender.send.assert_not_called()

    def test_dispatcher_error_does_not_propagate(self) -> None:
        self.dispatcher.dispatch.side_effect = RuntimeError("boom")
        event = self._make_event(EventType.PROJECT_CREATED)
        # Should not raise
        self.use_case.handle(event)

    def test_sender_error_does_not_propagate(self) -> None:
        self.sender.send.side_effect = RuntimeError("boom")
        event = self._make_event(EventType.PROJECT_CREATED)
        # Should not raise
        self.use_case.handle(event)
