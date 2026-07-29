from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import Membership, Role, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(
    *,
    subject: str,
    token_type: str,
    settings: Settings,
    expires_delta: timedelta,
    extra: dict | None = None,
) -> str:
    payload = {
        "sub": subject,
        "type": token_type,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(
    user: User,
    membership: Membership,
    tenant_slug: str,
    settings: Settings,
) -> str:
    return create_token(
        subject=str(user.id),
        token_type="access",
        settings=settings,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra={
            "email": user.email,
            "tenant_id": str(membership.tenant_id),
            "role": membership.role.value,
            "tenant_slug": tenant_slug,
        },
    )


def create_refresh_token(user: User, membership: Membership, settings: Settings) -> str:
    return create_token(
        subject=str(user.id),
        token_type="refresh",
        settings=settings,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra={"tenant_id": str(membership.tenant_id)},
    )


class AuthContext:
    def __init__(
        self,
        user: User,
        membership: Membership,
        tenant_slug: str,
        role: Role,
        correlation_id: str,
        ip_address: str | None,
    ):
        self.user = user
        self.membership = membership
        self.tenant_id = membership.tenant_id
        self.tenant_slug = tenant_slug
        self.role = role
        self.correlation_id = correlation_id
        self.ip_address = ip_address


def decode_token(token: str, settings: Settings) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_correlation_id(request: Request) -> str:
    return request.headers.get("X-Correlation-ID") or str(uuid.uuid4())


def get_current_auth(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials, settings)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")

    user = db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.tenant_id == uuid.UUID(tenant_id))
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenant membership")

    return AuthContext(
        user=user,
        membership=membership,
        tenant_slug=payload.get("tenant_slug") or "",
        role=membership.role,
        correlation_id=get_correlation_id(request),
        ip_address=request.client.host if request.client else None,
    )


def require_roles(*roles: Role):
    def _dep(auth: Annotated[AuthContext, Depends(get_current_auth)]) -> AuthContext:
        if auth.role not in roles and auth.role != Role.tenant_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return auth

    return _dep
