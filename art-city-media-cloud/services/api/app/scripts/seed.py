from __future__ import annotations

from app.config import get_settings
from app.db import SessionLocal
from app.models import Membership, Role, Tenant, User, Workspace
from app.security import hash_password
from app.storage import ensure_bucket


def seed() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        try:
            ensure_bucket(settings)
        except Exception as exc:
            print(f"Warning: could not ensure S3 bucket yet: {exc}")

        tenant = db.query(Tenant).filter(Tenant.slug == settings.seed_tenant_slug).first()
        if not tenant:
            tenant = Tenant(name=settings.seed_tenant_name, slug=settings.seed_tenant_slug)
            db.add(tenant)
            db.flush()
            print(f"Created tenant {tenant.slug}")
        else:
            print(f"Tenant {tenant.slug} already exists")

        user = db.query(User).filter(User.email == settings.seed_admin_email.lower()).first()
        if not user:
            user = User(
                email=settings.seed_admin_email.lower(),
                password_hash=hash_password(settings.seed_admin_password),
                full_name="Art City Admin",
            )
            db.add(user)
            db.flush()
            print(f"Created admin user {user.email}")
        else:
            print(f"Admin user {user.email} already exists")

        membership = (
            db.query(Membership)
            .filter(Membership.tenant_id == tenant.id, Membership.user_id == user.id)
            .first()
        )
        if not membership:
            db.add(Membership(tenant_id=tenant.id, user_id=user.id, role=Role.tenant_admin))
            print("Created tenant_admin membership")

        workspace = (
            db.query(Workspace)
            .filter(Workspace.tenant_id == tenant.id, Workspace.slug == "general")
            .first()
        )
        if not workspace:
            db.add(Workspace(tenant_id=tenant.id, name="General", slug="general"))
            print("Created General workspace")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
