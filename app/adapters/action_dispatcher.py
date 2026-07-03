"""Action dispatcher adapter (outbound)."""

from __future__ import annotations

import logging

from app.domain.models import Action
from app.ports.outbound import ActionDispatcherPort

logger = logging.getLogger(__name__)


class LoggingActionDispatcher(ActionDispatcherPort):
    """
    Stub action dispatcher that logs actions instead of executing them.
    Useful for local development and testing.
    """

    def dispatch(self, action: Action) -> None:
        logger.info(
            "ACTION [%s] → %s | params=%s",
            action.action_type,
            action.target,
            action.parameters,
        )


class HttpActionDispatcher(ActionDispatcherPort):
    """
    HTTP-based action dispatcher.

    TODO: Replace stub with a real HTTP client (e.g. httpx / requests).
    """

    def __init__(self, base_url: str, timeout: int = 10) -> None:
        self._base_url = base_url
        self._timeout = timeout

    def dispatch(self, action: Action) -> None:
        # TODO: implement real HTTP dispatch
        logger.info(
            "Dispatching action '%s' to '%s%s'",
            action.action_type,
            self._base_url,
            action.target,
        )
