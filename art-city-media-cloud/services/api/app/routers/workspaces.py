from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Workspace
from app.schemas import WorkspaceOut
from app.security import AuthContext, get_current_auth

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceOut])
def list_workspaces(
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(get_current_auth)],
):
    rows = db.query(Workspace).filter(Workspace.tenant_id == auth.tenant_id).order_by(Workspace.name).all()
    return rows
