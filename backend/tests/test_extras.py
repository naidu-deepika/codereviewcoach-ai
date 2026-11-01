from tests.conftest import SAMPLE_CODE, register


def review(client, headers):
    return client.post(
        "/api/v1/reviews", json={"language": "python", "code": SAMPLE_CODE}, headers=headers
    ).json()


def test_owner_can_delete_review(client, auth_headers):
    saved = review(client, auth_headers)
    assert client.delete(f"/api/v1/reviews/{saved['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"/api/v1/reviews/{saved['id']}", headers=auth_headers).status_code == 404
    assert client.get("/api/v1/dashboard", headers=auth_headers).json()["total_reviews"] == 0


def test_cannot_delete_someone_elses_review(client):
    ann = register(client, "ann@example.com", "Ann")
    bob = register(client, "bob@example.com", "Bob")
    saved = review(client, ann)
    assert client.delete(f"/api/v1/reviews/{saved['id']}", headers=bob).status_code == 404
    assert client.get(f"/api/v1/reviews/{saved['id']}", headers=ann).status_code == 200


def test_delete_needs_login(client):
    assert client.delete("/api/v1/reviews/1").status_code == 401


def test_practice_needs_login(client):
    assert client.get("/api/v1/practice").status_code == 401


def test_new_user_gets_warmup_exercises(client, auth_headers):
    body = client.get("/api/v1/practice", headers=auth_headers).json()
    assert len(body["exercises"]) >= 3
    assert body["based_on"] == []
    for ex in body["exercises"]:
        assert ex["prompt"] and ex["hint"] and ex["solution"] and ex["reason"]


def test_practice_follows_the_users_own_mistakes(client, auth_headers):
    review(client, auth_headers)  # sample code has a mutable default argument
    body = client.get("/api/v1/practice", headers=auth_headers).json()
    assert "Mutable default argument" in body["based_on"]
    assert body["exercises"][0]["id"] in {"mutable-default", "division-by-zero"}
    other = register(client, "bob@example.com", "Bob")
    assert client.get("/api/v1/practice", headers=other).json()["based_on"] == []


def test_every_bank_solution_is_valid_python():
    import ast
    from app.services.practice_service import BY_MISTAKE, STARTERS

    from app.analysis.python_analyzer import analyze_python

    for item in list(BY_MISTAKE.values()) + STARTERS:
        ast.parse(item["solution"])
        # our own solutions must pass our own checks
        assert analyze_python(item["solution"]) == [], item["id"]
