from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditEvent
from app.security import AuthContext


def write_audit(
    db: Session,
    *,
    action: str,
    object_type: str,
    object_id: str | None = None,
    auth: AuthContext | None = None,
    tenant_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    before_ref: dict[str, Any] | None = None,
    after_ref: dict[str, Any] | None = None,
    ip_address: str | None = None,
    correlation_id: str | None = None,
) -> AuditEvent:
    event = AuditEvent(
        tenant_id=tenant_id or (auth.tenant_id if auth else None),
        actor_user_id=actor_user_id or (auth.user.id if auth else None),
        action=action,
        object_type=object_type,
        object_id=object_id,
        before_ref=before_ref,
        after_ref=after_ref,
        ip_address=ip_address or (auth.ip_address if auth else None),
        correlation_id=correlation_id or (auth.correlation_id if auth else None),
    )
    db.add(event)
    return event
