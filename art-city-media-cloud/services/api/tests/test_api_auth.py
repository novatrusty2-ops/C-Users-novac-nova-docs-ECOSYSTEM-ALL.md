import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_login_seed_user_and_tenant_isolation():
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@artcity.example", "password": "ChangeMeNow!", "tenant_slug": "art-city"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["tenant_slug"] == "art-city"

    created = client.post(
        "/api/v1/assets",
        headers=headers,
        json={"title": f"Isolation {uuid.uuid4()}", "description": "tenant a"},
    )
    assert created.status_code == 201
    asset_id = created.json()["id"]

    # Register a second tenant and ensure it cannot see tenant A asset
    slug = f"other-{uuid.uuid4().hex[:8]}"
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"{slug}@example.com",
            "password": "OtherTenant1!",
            "full_name": "Other Admin",
            "tenant_name": "Other",
            "tenant_slug": slug,
        },
    )
    assert reg.status_code == 200, reg.text
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    missing = client.get(f"/api/v1/assets/{asset_id}", headers=other_headers)
    assert missing.status_code == 404
