"""Domain models for the Event Processing Service."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional


class EventType(str, Enum):
    """Supported project event types."""

    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_DELETED = "project.deleted"
    TASK_CREATED = "task.created"
    TASK_UPDATED = "task.updated"
    TASK_COMPLETED = "task.completed"
    GENERIC = "generic"


class NotificationChannel(str, Enum):
    """Supported notification delivery channels."""

    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"


@dataclass
class Event:
    """Represents an inbound project event."""

    event_type: EventType
    payload: Dict[str, Any]
    source: str
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.source:
            raise ValueError("Event source must not be empty.")
        if not isinstance(self.payload, dict):
            raise TypeError("Event payload must be a dictionary.")


@dataclass
class Action:
    """An action to be triggered in response to an event."""

    action_type: str
    target: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    action_id: str = field(default_factory=lambda: str(uuid.uuid4()))


@dataclass
class Notification:
    """A notification to be dispatched."""

    channel: NotificationChannel
    recipient: str
    subject: str
    body: str
    notification_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sent_at: Optional[datetime] = None
