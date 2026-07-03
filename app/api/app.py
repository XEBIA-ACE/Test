"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import health


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Event Processing Service",
        description=(
            "Subscribes to project events, triggers actions, "
            "and sends notifications."
        ),
        version="0.1.0",
    )

    app.include_router(health.router, prefix="/health", tags=["health"])

    return app
