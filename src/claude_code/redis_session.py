"""
Redis-backed session storage for distributed workers.

Enables session state to be shared across multiple Celery workers,
replacing the in-memory SessionManager for distributed deployments.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, UTC
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Try to import redis
try:
    import redis.asyncio as aioredis

    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    aioredis = None
    logger.warning("redis[asyncio] not installed, RedisSessionManager unavailable")

# Try to import cluster-compatible URL helper
try:
    from x_sdlc_core.utils.redis_utils import get_cluster_compatible_redis_url
except ImportError:

    def get_cluster_compatible_redis_url(url: str) -> str:
        """Fallback - return URL as-is if x_sdlc_core not available."""
        return url


# Session TTLs
RUNNING_SESSION_TTL = 3600  # 1 hour for running sessions
COMPLETED_SESSION_TTL = 300  # 5 minutes for completed sessions (grace period)
APPROVAL_TIMEOUT = 300  # 5 minutes timeout for approval


class RedisSessionManager:
    """
    Distributed session manager using Redis.

    Replaces in-memory SessionManager for multi-worker deployments.
    Sessions are stored as Redis hashes with JSON-serialized complex fields.
    Approval events use Redis Pub/Sub for cross-worker communication.
    """

    def __init__(self, redis_url: str = None):
        """
        Initialize RedisSessionManager.

        Args:
            redis_url: Redis connection URL. Defaults to REDIS_URL env var or localhost.
        """
        if not HAS_REDIS:
            raise RuntimeError("redis[asyncio] package required. Install with: pip install redis[asyncio]")

        raw_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/3")
        self.redis_url = get_cluster_compatible_redis_url(raw_url)
        self._redis: Optional[aioredis.Redis] = None
        self._redis_loop: Optional[asyncio.AbstractEventLoop] = None  # Track which loop owns the connection
        logger.info(f"RedisSessionManager initialized with URL: {self.redis_url}")

    async def _get_redis(self) -> aioredis.Redis:
        """
        Get or create Redis connection.

        Handles event loop changes (common in Celery workers where each task
        may run in a new event loop). If the event loop has changed since
        the connection was created, closes the old connection and creates
        a new one attached to the current loop.
        """
        current_loop = asyncio.get_running_loop()

        # Check if we need to recreate connection due to event loop change
        if self._redis is not None and self._redis_loop is not current_loop:
            logger.warning("Event loop changed - closing stale Redis connection and creating new one")
            try:
                await self._redis.close()
            except Exception as e:
                logger.debug(f"Error closing stale Redis connection: {e}")
            self._redis = None
            self._redis_loop = None

        if self._redis is None:
            self._redis = await aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            self._redis_loop = current_loop
            logger.debug("Redis connection established for current event loop")

        return self._redis

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            self._redis_loop = None
            logger.debug("Redis connection closed")

    def _session_key(self, session_id: str) -> str:
        """Generate Redis key for session."""
        return f"claude_session:{session_id}"

    async def create_session(
        self,
        session_id: str,
        working_directory: str,
        prompt: str,
        metadata: Dict = None,
    ) -> Dict:
        """
        Create new session in Redis.

        Args:
            session_id: Unique session identifier
            working_directory: Working directory for scaffolding
            prompt: Initial prompt
            metadata: Optional metadata dict

        Returns:
            Session data dictionary
        """
        r = await self._get_redis()
        now = datetime.now(UTC).isoformat()

        session_data = {
            "id": session_id,
            "status": "pending",
            "working_directory": working_directory,
            "prompt": prompt,
            "messages": "[]",  # JSON array
            "result": "",
            "error": "",
            "pending_approval": "",
            "approval_response": "",
            "metadata": json.dumps(metadata or {}),
            "created_at": now,
            "updated_at": now,
        }

        key = self._session_key(session_id)
        await r.hset(key, mapping=session_data)
        await r.expire(key, RUNNING_SESSION_TTL)

        logger.info(f"Created session {session_id} in Redis")
        return self._deserialize_session(session_data)

    def _deserialize_session(self, data: Dict[str, str]) -> Dict[str, Any]:
        """Deserialize session data from Redis hash format."""
        if not data:
            return None

        result = dict(data)

        # Parse JSON fields
        result["messages"] = json.loads(data.get("messages", "[]"))
        result["metadata"] = json.loads(data.get("metadata", "{}"))

        # Parse pending_approval (could be JSON or empty)
        pending = data.get("pending_approval", "")
        result["pending_approval"] = json.loads(pending) if pending else None

        # Parse approval_response (bool or None)
        approval = data.get("approval_response", "")
        if approval == "true":
            result["approval_response"] = True
        elif approval == "false":
            result["approval_response"] = False
        else:
            result["approval_response"] = None

        return result

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Get session from Redis.

        Args:
            session_id: Session identifier

        Returns:
            Session data dictionary or None if not found
        """
        r = await self._get_redis()
        key = self._session_key(session_id)
        data = await r.hgetall(key)

        if not data:
            logger.warning(f"Session {session_id} not found in Redis")
            return None

        return self._deserialize_session(data)

    async def update_session(self, session_id: str, **updates) -> bool:
        """
        Update session fields in Redis.

        Args:
            session_id: Session identifier
            **updates: Fields to update

        Returns:
            True if successful
        """
        r = await self._get_redis()
        key = self._session_key(session_id)

        # Serialize complex fields
        serialized = {}
        for field, value in updates.items():
            if field == "messages":
                serialized[field] = json.dumps(value)
            elif field == "metadata":
                serialized[field] = json.dumps(value)
            elif field == "pending_approval":
                serialized[field] = json.dumps(value) if value else ""
            elif field == "approval_response":
                if value is True:
                    serialized[field] = "true"
                elif value is False:
                    serialized[field] = "false"
                else:
                    serialized[field] = ""
            else:
                serialized[field] = value if value is not None else ""

        serialized["updated_at"] = datetime.now(UTC).isoformat()

        await r.hset(key, mapping=serialized)

        # Adjust TTL based on status
        status = updates.get("status")
        if status in ("completed", "error", "cancelled"):
            await r.expire(key, COMPLETED_SESSION_TTL)
            logger.debug(f"Session {session_id} TTL set to {COMPLETED_SESSION_TTL}s (completed)")

        logger.debug(f"Updated session {session_id}: {list(updates.keys())}")
        return True

    async def add_message(self, session_id: str, message: Dict):
        """
        Append message to session history.

        Args:
            session_id: Session identifier
            message: Message dict to append
        """
        r = await self._get_redis()
        key = self._session_key(session_id)

        # Get current messages
        messages_json = await r.hget(key, "messages")
        messages = json.loads(messages_json or "[]")
        messages.append(message)

        await r.hset(
            key,
            mapping={
                "messages": json.dumps(messages),
                "updated_at": datetime.now(UTC).isoformat(),
            },
        )

    async def set_approval_response(self, session_id: str, approved: bool):
        """
        Set approval response (called from API when user approves/rejects).

        Also publishes an event for workers waiting on approval.

        Args:
            session_id: Session identifier
            approved: True if approved, False if rejected
        """
        await self.update_session(session_id, approval_response=approved)

        # Publish event for worker to pick up
        r = await self._get_redis()
        channel = f"approval:{session_id}"
        message = "approved" if approved else "rejected"
        await r.publish(channel, message)
        logger.info(f"Published approval response for {session_id}: {message}")

    async def publish_session_update(self, session_id: str, update_type: str, data: Dict = None):
        """
        Publish session update for WebSocket bridge.

        Workers call this to broadcast updates. FastAPI WebSocket handlers
        subscribe to receive and forward to connected clients.

        Args:
            session_id: Session identifier
            update_type: One of "message", "approval_required", "completed", "error", "status"
            data: Update payload (will be JSON-serialized)
        """
        r = await self._get_redis()
        channel = f"session_updates:{session_id}"
        payload = json.dumps({"type": update_type, "timestamp": datetime.now(UTC).isoformat(), "data": data or {}})
        await r.publish(channel, payload)
        logger.debug(f"Published {update_type} update for session {session_id}")

    async def wait_for_approval(self, session_id: str, timeout: int = APPROVAL_TIMEOUT) -> Optional[bool]:
        """
        Wait for approval response via Redis pub/sub.

        This is called from Celery workers when they need user approval.
        Uses pub/sub with polling fallback to handle race conditions.

        Args:
            session_id: Session identifier
            timeout: Timeout in seconds

        Returns:
            True if approved, False if rejected, None if timeout
        """
        r = await self._get_redis()
        pubsub = r.pubsub()
        channel = f"approval:{session_id}"

        try:
            await pubsub.subscribe(channel)
            logger.info(f"Waiting for approval on {session_id} (timeout: {timeout}s)")

            start = datetime.now(UTC)
            while (datetime.now(UTC) - start).total_seconds() < timeout:
                # Try to get message with short timeout
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=2.0)

                if message and message.get("type") == "message":
                    data = message.get("data", "")
                    logger.info(f"Received approval message for {session_id}: {data}")
                    return data == "approved"

                # Fallback: check session directly (in case message was missed)
                session = await self.get_session(session_id)
                if session and session.get("approval_response") is not None:
                    logger.info(f"Found approval in session data for {session_id}")
                    return session["approval_response"]

                await asyncio.sleep(1)

            logger.warning(f"Approval timeout for session {session_id}")
            return None

        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete session from Redis.

        Args:
            session_id: Session identifier

        Returns:
            True if deleted, False if not found
        """
        r = await self._get_redis()
        key = self._session_key(session_id)
        deleted = await r.delete(key)

        if deleted:
            logger.info(f"Deleted session {session_id} from Redis")
        return bool(deleted)

    async def list_sessions(self, pattern: str = "*") -> List[Dict]:
        """
        List all sessions matching pattern.

        Args:
            pattern: Redis key pattern (e.g., "*" for all)

        Returns:
            List of session data dictionaries
        """
        r = await self._get_redis()
        key_pattern = f"claude_session:{pattern}"

        sessions = []
        async for key in r.scan_iter(match=key_pattern):
            data = await r.hgetall(key)
            if data:
                sessions.append(self._deserialize_session(data))

        return sessions

    async def get_active_sessions_count(self) -> int:
        """Get count of active (running or waiting) sessions."""
        sessions = await self.list_sessions()
        return sum(1 for s in sessions if s.get("status") in ("running", "waiting_approval"))


# Global instance (created lazily to avoid import-time errors)
_redis_session_manager: Optional[RedisSessionManager] = None


def get_redis_session_manager() -> RedisSessionManager:
    """
    Get or create the global RedisSessionManager instance.

    Returns:
        RedisSessionManager instance

    Raises:
        RuntimeError: If redis package not available
    """
    global _redis_session_manager
    if _redis_session_manager is None:
        _redis_session_manager = RedisSessionManager()
    return _redis_session_manager
