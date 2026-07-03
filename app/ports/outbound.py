"""Outbound ports — interfaces the application drives."""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import Action, Notification


class ActionDispatcherPort(ABC):
    """Outbound port: executes a derived action."""

    @abstractmethod
    def dispatch(self, action: Action) -> None:
        """Execute *action*."""


class NotificationSenderPort(ABC):
    """Outbound port: sends a notification to a recipient."""

    @abstractmethod
    def send(self, notification: Notification) -> None:
        """Deliver *notification* to its recipient."""


class EventPublisherPort(ABC):
    """Outbound port: publishes an event to a message broker."""

    @abstractmethod
    def publish(self, topic: str, payload: dict) -> None:
        """Publish *payload* to *topic*."""
