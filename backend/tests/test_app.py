from tests.conftest import SAMPLE_CODE, register


def post_review(client, headers=None, code=SAMPLE_CODE):
    return client.post(
        "/api/v1/reviews", json={"language": "python", "code": code}, headers=headers or {}
    )


# ---------- health ----------
def test_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


# ---------- registration and login ----------
def test_register_returns_token_and_never_the_password(client):
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Ann", "email": "Ann@Example.com", "password": "password123"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"]
    assert body["user"]["email"] == "ann@example.com"
    assert "password" not in res.text


def test_password_is_stored_hashed():
    from app.db.database import SessionLocal
    from app.db.models import User
    from fastapi.testclient import TestClient
    from app.main import app

    TestClient(app).post(
        "/api/v1/auth/register",
        json={"name": "Ann", "email": "ann@example.com", "password": "password123"},
    )
    with SessionLocal() as db:
        user = db.query(User).one()
        assert user.password_hash != "password123"
        assert "password123" not in user.password_hash
        assert user.password_hash.startswith("scrypt$")


def test_register_rejects_duplicate_email(client):
    register(client)
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Other", "email": "ann@example.com", "password": "password123"},
    )
    assert res.status_code == 409


def test_register_validates_input(client):
    bad_email = client.post(
        "/api/v1/auth/register", json={"name": "A", "email": "nope", "password": "password123"}
    )
    short_password = client.post(
        "/api/v1/auth/register", json={"name": "A", "email": "a@b.com", "password": "short"}
    )
    assert bad_email.status_code == 422
    assert short_password.status_code == 422


def test_login_with_correct_password(client):
    register(client)
    res = client.post(
        "/api/v1/auth/login", json={"email": "ann@example.com", "password": "password123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "ann@example.com"


def test_login_with_wrong_password_or_unknown_email(client):
    register(client)
    wrong = client.post(
        "/api/v1/auth/login", json={"email": "ann@example.com", "password": "wrong-password"}
    )
    unknown = client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "password123"}
    )
    assert wrong.status_code == 401
    assert unknown.status_code == 401
    assert wrong.json()["detail"] == unknown.json()["detail"]


def test_protected_routes_need_a_valid_token(client):
    for path in ("/api/v1/reviews", "/api/v1/dashboard", "/api/v1/progress", "/api/v1/auth/me"):
        assert client.get(path).status_code == 401
        assert client.get(path, headers={"Authorization": "Bearer garbage"}).status_code == 401


# ---------- review persistence and history ----------
def test_guest_can_review_but_nothing_is_saved(client, auth_headers):
    res = post_review(client)
    assert res.status_code == 200
    assert res.json()["id"] is None
    assert client.get("/api/v1/reviews", headers=auth_headers).json() == []


def test_signed_in_review_is_saved(client, auth_headers):
    res = post_review(client, auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["id"] is not None
    assert body["score"] is not None

    history = client.get("/api/v1/reviews", headers=auth_headers).json()
    assert len(history) == 1
    assert history[0]["id"] == body["id"]
    assert history[0]["score"] == body["score"]
    assert history[0]["issue_count"] == len(body["findings"])


def test_saved_review_detail_matches(client, auth_headers):
    saved = post_review(client, auth_headers).json()
    detail = client.get(f"/api/v1/reviews/{saved['id']}", headers=auth_headers)
    assert detail.status_code == 200
    d = detail.json()
    assert d["code"] == SAMPLE_CODE
    assert d["score"] == saved["score"]
    assert d["findings"] == saved["findings"]
    assert d["corrected_code"] == saved["corrected_code"]
    assert d["verification"] == saved["verification"]


def test_reviews_survive_a_new_database_session(client, auth_headers):
    saved = post_review(client, auth_headers).json()
    from app.db.database import SessionLocal
    from app.db.models import Review

    with SessionLocal() as db:  # a brand-new session reads what was committed
        assert db.get(Review, saved["id"]).score == saved["score"]


def test_syntax_error_review_is_not_saved(client, auth_headers):
    res = post_review(client, auth_headers, code="def f(:\n    pass")
    assert res.status_code == 200
    assert res.json()["score"] is None
    assert client.get("/api/v1/reviews", headers=auth_headers).json() == []


def test_missing_review_is_404(client, auth_headers):
    assert client.get("/api/v1/reviews/9999", headers=auth_headers).status_code == 404


# ---------- user data isolation ----------
def test_users_cannot_see_each_others_reviews(client):
    ann = register(client, "ann@example.com", "Ann")
    bob = register(client, "bob@example.com", "Bob")
    ann_review = post_review(client, ann).json()

    assert client.get("/api/v1/reviews", headers=bob).json() == []
    assert client.get(f"/api/v1/reviews/{ann_review['id']}", headers=bob).status_code == 404
    assert client.get(f"/api/v1/reviews/{ann_review['id']}", headers=ann).status_code == 200
    assert client.get("/api/v1/dashboard", headers=bob).json()["total_reviews"] == 0


# ---------- dashboard and progress ----------
def test_dashboard_for_new_user_is_all_zeros(client, auth_headers):
    res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == {
        "total_reviews": 0,
        "average_score": 0,
        "total_issues": 0,
        "common_mistakes": [],
        "reviews_over_time": [],
        "languages": [],
    }


def test_progress_for_new_user_is_empty(client, auth_headers):
    body = client.get("/api/v1/progress", headers=auth_headers).json()
    assert body["score_trend"] == []
    assert body["latest_score"] is None
    assert body["change"] == 0


def test_dashboard_numbers_come_from_saved_reviews(client, auth_headers):
    first = post_review(client, auth_headers).json()
    second = post_review(client, auth_headers).json()
    stats = client.get("/api/v1/dashboard", headers=auth_headers).json()

    assert stats["total_reviews"] == 2
    assert stats["average_score"] == round((first["score"] + second["score"]) / 2, 1)
    assert stats["total_issues"] == len(first["findings"]) + len(second["findings"])
    assert stats["languages"] == [{"language": "python", "count": 2}]
    assert stats["reviews_over_time"][0]["count"] == 2
    top = {m["message"]: m["count"] for m in stats["common_mistakes"]}
    assert top["Mutable default argument"] == 2


def test_progress_numbers_come_from_saved_reviews(client, auth_headers):
    first = post_review(client, auth_headers).json()
    clean = post_review(client, auth_headers, code="print('hi')\n").json()
    p = client.get("/api/v1/progress", headers=auth_headers).json()

    assert [t["score"] for t in p["score_trend"]] == [first["score"], clean["score"]]
    assert p["first_score"] == first["score"]
    assert p["latest_score"] == clean["score"]
    assert p["best_score"] == max(first["score"], clean["score"])
    assert p["change"] == clean["score"] - first["score"]

