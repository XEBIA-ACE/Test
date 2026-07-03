"""Tests for the health check endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.app import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = create_app()
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_ok_status(self, client: TestClient) -> None:
        data = response = client.get("/health").json()
        assert data["status"] == "ok"

    def test_health_returns_service_name(self, client: TestClient) -> None:
        data = client.get("/health").json()
        assert data["service"] == "event-processing-service"

    def test_health_returns_version(self, client: TestClient) -> None:
        data = client.get("/health").json()
        assert "version" in data
        assert data["version"]

    def test_health_response_schema(self, client: TestClient) -> None:
        data = client.get("/health").json()
        assert set(data.keys()) == {"status", "service", "version"}
