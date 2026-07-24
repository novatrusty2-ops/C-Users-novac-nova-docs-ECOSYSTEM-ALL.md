from __future__ import annotations

import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.config import Settings, get_settings
from app.db import get_db
from app.models import Membership, Role, Tenant, User, Workspace
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserOut
from app.security import (
    AuthContext,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_auth,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


@router.post("/register", response_model=TokenResponse)
def register(
    body: RegisterRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    if not _SLUG_RE.match(body.tenant_slug):
        raise HTTPException(status_code=400, detail="Invalid tenant_slug")
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(Tenant).filter(Tenant.slug == body.tenant_slug).first():
        raise HTTPException(status_code=409, detail="Tenant slug taken")

    tenant = Tenant(name=body.tenant_name, slug=body.tenant_slug)
    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(tenant)
    db.add(user)
    db.flush()
    membership = Membership(tenant_id=tenant.id, user_id=user.id, role=Role.tenant_admin)
    workspace = Workspace(tenant_id=tenant.id, name="General", slug="general")
    db.add(membership)
    db.add(workspace)
    write_audit(
        db,
        action="auth.register",
        object_type="tenant",
        object_id=str(tenant.id),
        tenant_id=tenant.id,
        actor_user_id=user.id,
        after_ref={"email": user.email, "tenant_slug": tenant.slug},
        ip_address=request.client.host if request.client else None,
        correlation_id=request.headers.get("X-Correlation-ID") or str(uuid.uuid4()),
    )
    db.commit()

    access = create_access_token(user, membership, tenant.slug, settings)
    refresh = create_refresh_token(user, membership, settings)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    q = db.query(Membership).filter(Membership.user_id == user.id)
    if body.tenant_slug:
        tenant = db.query(Tenant).filter(Tenant.slug == body.tenant_slug).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        membership = q.filter(Membership.tenant_id == tenant.id).first()
    else:
        membership = q.first()
        tenant = db.get(Tenant, membership.tenant_id) if membership else None

    if not membership or not tenant:
        raise HTTPException(status_code=403, detail="No tenant membership")

    write_audit(
        db,
        action="auth.login",
        object_type="user",
        object_id=str(user.id),
        tenant_id=tenant.id,
        actor_user_id=user.id,
        ip_address=request.client.host if request.client else None,
        correlation_id=request.headers.get("X-Correlation-ID") or str(uuid.uuid4()),
    )
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user, membership, tenant.slug, settings),
        refresh_token=create_refresh_token(user, membership, settings),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    payload = decode_token(body.refresh_token, settings)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive")
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.tenant_id == uuid.UUID(payload["tenant_id"]))
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="No tenant membership")
    tenant = db.get(Tenant, membership.tenant_id)
    assert tenant is not None
    return TokenResponse(
        access_token=create_access_token(user, membership, tenant.slug, settings),
        refresh_token=create_refresh_token(user, membership, settings),
    )


@router.get("/me", response_model=UserOut)
def me(auth: Annotated[AuthContext, Depends(get_current_auth)]):
    return UserOut(
        id=auth.user.id,
        email=auth.user.email,
        full_name=auth.user.full_name,
        tenant_id=auth.tenant_id,
        tenant_slug=auth.tenant_slug,
        role=auth.role,
    )
