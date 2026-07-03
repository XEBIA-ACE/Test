"""Inbound ports — interfaces that drive the application."""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import Event


class EventConsumerPort(ABC):
    """Inbound port: something that feeds events into the application."""

    @abstractmethod
    def start(self) -> None:
        """Begin consuming events (blocking or background)."""

    @abstractmethod
    def stop(self) -> None:
        """Gracefully stop consuming events."""


class EventHandlerPort(ABC):
    """Inbound port: handles a single event (called by the consumer)."""

    @abstractmethod
    def handle(self, event: Event) -> None:
        """Process *event* and trigger downstream side-effects."""
