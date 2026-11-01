import json
import os
import tempfile

# Use a throwaway database and key. This runs before the app is imported,
# so the real database file is never touched.
_TEST_DIR = tempfile.mkdtemp(prefix="crc_tests_")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DIR}/test.db"
os.environ["SECRET_KEY"] = "test-secret-key-only-for-tests-0123456789abcdef"
os.environ["GEMINI_API_KEY"] = "fake-key-for-tests"

import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, engine
from app.main import app

FAKE_AI_ANSWER = json.dumps(
    {
        "summary": "Looks fine overall.",
        "findings": [
            {
                "category": "correctness",
                "severity": "medium",
                "message": "Possible division by zero",
                "explanation": "len(numbers) can be 0.",
                "line_start": 5,
                "line_end": 5,
                "suggested_fix": "Check for an empty list first.",
            }
        ],
        "corrected_code": "def average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n",
    }
)

SAMPLE_CODE = (
    "def add_item(item, items=[]):\n"
    "    items.append(item)\n"
    "    return items\n"
    "\n"
    "def average(numbers):\n"
    "    return sum(numbers) / len(numbers)\n"
)


@pytest.fixture(autouse=True)
def fresh_database():
    Base.metadata.drop_all(bind=engine)
    from app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def fake_gemini(monkeypatch):
    class FakeProvider:
        def generate(self, prompt: str) -> str:
            return FAKE_AI_ANSWER

    monkeypatch.setattr("app.services.review_service.GeminiProvider", FakeProvider)


@pytest.fixture
def client():
    return TestClient(app)


def register(client, email="ann@example.com", name="Ann", password="password123"):
    res = client.post(
        "/api/v1/auth/register", json={"name": name, "email": email, "password": password}
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def auth_headers(client):
    return register(client)
