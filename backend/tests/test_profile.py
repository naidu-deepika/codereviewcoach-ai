from tests.conftest import SAMPLE_CODE, register


def test_profile_needs_login(client):
    assert client.get("/api/v1/profile").status_code == 401
    assert client.put("/api/v1/profile", json={}).status_code == 401


def test_new_user_gets_defaults(client, auth_headers):
    body = client.get("/api/v1/profile", headers=auth_headers).json()
    assert body["name"] == "Ann"
    assert body["email"] == "ann@example.com"
    assert body["experience_level"] == "beginner"
    assert body["languages"] == []
    assert body["total_reviews"] == 0


def test_update_is_saved_and_returned_later(client, auth_headers):
    res = client.put(
        "/api/v1/profile",
        headers=auth_headers,
        json={"name": "  Ann Lee ", "experience_level": "advanced", "languages": ["Java", "Python", "Java"]},
    )
    assert res.status_code == 200
    body = client.get("/api/v1/profile", headers=auth_headers).json()
    assert body["name"] == "Ann Lee"
    assert body["experience_level"] == "advanced"
    assert body["languages"] == ["Python", "Java"]
    # the name also changes on the account itself
    assert client.get("/api/v1/auth/me", headers=auth_headers).json()["name"] == "Ann Lee"


def test_update_twice_works(client, auth_headers):
    for level in ("intermediate", "beginner"):
        res = client.put(
            "/api/v1/profile",
            headers=auth_headers,
            json={"name": "Ann", "experience_level": level, "languages": ["C"]},
        )
        assert res.status_code == 200
    assert client.get("/api/v1/profile", headers=auth_headers).json()["experience_level"] == "beginner"


def test_invalid_updates_are_rejected(client, auth_headers):
    bad = [
        {"name": "", "experience_level": "beginner", "languages": []},
        {"name": "   ", "experience_level": "beginner", "languages": []},
        {"name": "Ann", "experience_level": "expert", "languages": []},
        {"name": "Ann", "experience_level": "beginner", "languages": ["Klingon"]},
    ]
    for payload in bad:
        assert client.put("/api/v1/profile", headers=auth_headers, json=payload).status_code == 422
    assert client.get("/api/v1/profile", headers=auth_headers).json()["name"] == "Ann"


def test_profiles_are_separate_per_user(client):
    ann = register(client, "ann@example.com", "Ann")
    bob = register(client, "bob@example.com", "Bob")
    client.put(
        "/api/v1/profile",
        headers=ann,
        json={"name": "Ann", "experience_level": "advanced", "languages": ["Go"]},
    )
    body = client.get("/api/v1/profile", headers=bob).json()
    assert body["experience_level"] == "beginner"
    assert body["languages"] == []


def test_total_reviews_counts_only_own_saved_reviews(client, auth_headers):
    other = register(client, "bob@example.com", "Bob")
    client.post("/api/v1/reviews", json={"language": "python", "code": SAMPLE_CODE}, headers=auth_headers)
    client.post("/api/v1/reviews", json={"language": "python", "code": SAMPLE_CODE}, headers=other)
    client.post("/api/v1/reviews", json={"language": "python", "code": SAMPLE_CODE}, headers=other)
    assert client.get("/api/v1/profile", headers=auth_headers).json()["total_reviews"] == 1
    assert client.get("/api/v1/profile", headers=other).json()["total_reviews"] == 2
