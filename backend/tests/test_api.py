import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "GridBricks API"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cacheStatus" in data

def test_dates_endpoint():
    response = client.get("/api/dates")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 31
    assert "2026-01-14" in data["dates"]
