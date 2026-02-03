"""
Session Management for Claude Code Scaffolding.

Handles session state, approval events, and WebSocket connections.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class SessionStatus(str, Enum):
    """Session status enumeration."""

    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


@dataclass
class Session:
    """Session data structure for Claude Code scaffolding."""

    id: str
    status: SessionStatus = SessionStatus.RUNNING
    messages: List[Dict[str, Any]] = field(default_factory=list)
    pending_approval: Optional[Dict[str, Any]] = None
    result: Optional[str] = None
    error: Optional[str] = None
    approval_event: asyncio.Event = field(default_factory=asyncio.Event)
    approval_response: Optional[bool] = None
    websocket: Optional[WebSocket] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    working_directory: Optional[str] = None
    prompt: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def update_status(self, new_status: SessionStatus):
        """Update session status and timestamp."""
        self.status = new_status
        self.updated_at = datetime.now(UTC)

    def add_message(self, message: Dict[str, Any]):
        """Add message to session history."""
        self.messages.append(message)
        self.updated_at = datetime.now(UTC)

    def set_pending_approval(self, approval_info: Dict[str, Any]):
        """Set pending approval information."""
        self.pending_approval = approval_info
        self.status = SessionStatus.WAITING_APPROVAL
        self.updated_at = datetime.now(UTC)

    def clear_pending_approval(self):
        """Clear pending approval and resume execution."""
        self.pending_approval = None
        self.status = SessionStatus.RUNNING
        self.updated_at = datetime.now(UTC)

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary for API responses."""
        metadata = getattr(self, "metadata", {})
        return {
            "session_id": self.id,
            "status": self.status.value,
            "pending_approval": self.pending_approval,
            "messages_count": len(self.messages),
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "working_directory": self.working_directory,
            "storage_url": metadata.get("storage_url"),  # Unified cloud storage URL
            "s3_url": metadata.get("s3_url"),
            "azure_url": metadata.get("azure_url"),
            "gcs_url": metadata.get("gcs_url"),
            "github_url": metadata.get("github_url"),
            "download_url": metadata.get("download_url"),
        }


class SessionManager:
    """Manages active Claude Code scaffolding sessions."""

    def __init__(self, max_sessions: int = 100, session_timeout: int = 3600, completed_session_grace_period: int = 300):
        """
        Initialize session manager.

        Args:
            max_sessions: Maximum number of concurrent sessions
            session_timeout: Session timeout in seconds for running sessions
            completed_session_grace_period: Grace period in seconds to keep completed sessions (default: 5 minutes)
        """
        self.sessions: Dict[str, Session] = {}
        self.max_sessions = max_sessions
        self.session_timeout = session_timeout
        self.completed_session_grace_period = completed_session_grace_period
        self.logger = logging.getLogger(__name__)

    def create_session(
            self,
            session_id: str,
            working_directory: str,
            prompt: str,
    ) -> Session:
        """
        Create a new session.

        Args:
            session_id: Unique session identifier
            working_directory: Working directory for scaffolding
            prompt: Initial prompt

        Returns:
            Created session

        Raises:
            ValueError: If max sessions reached
        """
        if len(self.sessions) >= self.max_sessions:
            # Remove oldest completed/error sessions
            self._cleanup_old_sessions()

        if len(self.sessions) >= self.max_sessions:
            raise ValueError(f"Maximum sessions ({self.max_sessions}) reached")

        session = Session(
            id=session_id,
            working_directory=working_directory,
            prompt=prompt,
        )
        self.sessions[session_id] = session
        self.logger.info(f"Created session: {session_id}")
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get session by ID."""
        session = self.sessions.get(session_id)
        if not session:
            # Log available sessions for debugging
            self.logger.warning(
                f"Session {session_id} not found in local memory. "
                f"Available sessions: {list(self.sessions.keys())}. "
                f"This may indicate the request hit a different container instance."
            )
        return session

    def delete_session(self, session_id: str) -> bool:
        """Delete session by ID."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            if session.websocket:
                # Close WebSocket if connected
                try:
                    asyncio.create_task(session.websocket.close())
                except Exception:
                    pass
            del self.sessions[session_id]
            self.logger.info(f"Deleted session: {session_id}")
            return True
        return False

    def _cleanup_old_sessions(self):
        """Remove old completed or error sessions."""
        current_time = datetime.now(UTC)
        to_remove = []
        min_age_for_cleanup = 60  # Don't cleanup sessions younger than 60 seconds

        for session_id, session in self.sessions.items():
            age = (current_time - session.updated_at).total_seconds()

            # Never cleanup very young sessions (they might be starting up)
            if age < min_age_for_cleanup:
                continue

            # For completed/error/cancelled sessions, use grace period (5 minutes)
            if session.status in (SessionStatus.COMPLETED, SessionStatus.ERROR, SessionStatus.CANCELLED):
                if age > self.completed_session_grace_period:
                    to_remove.append(session_id)
                    self.logger.info(
                        f"Marking session {session_id} for cleanup: status={session.status.value}, age={age:.1f}s")
            # For running/waiting sessions, use much longer timeout (1 hour)
            elif session.status in (SessionStatus.RUNNING, SessionStatus.WAITING_APPROVAL):
                if age > self.session_timeout:
                    to_remove.append(session_id)
                    self.logger.info(
                        f"Marking session {session_id} for cleanup: status={session.status.value}, age={age:.1f}s (timeout={self.session_timeout}s)")

        for session_id in to_remove:
            self.delete_session(session_id)

        if to_remove:
            self.logger.info(f"Cleaned up {len(to_remove)} old sessions")

    def get_active_sessions_count(self) -> int:
        """Get count of active (running or waiting) sessions."""
        return sum(
            1
            for s in self.sessions.values()
            if s.status in (SessionStatus.RUNNING, SessionStatus.WAITING_APPROVAL)
        )


# Global session manager instance
session_manager = SessionManager()
