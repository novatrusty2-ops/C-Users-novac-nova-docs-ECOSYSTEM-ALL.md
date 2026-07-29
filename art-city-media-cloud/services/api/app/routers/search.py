from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Asset, AssetStatus, AssetType
from app.routers.assets import _serialize_asset
from app.schemas import AssetListOut
from app.security import AuthContext, get_current_auth

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/assets", response_model=AssetListOut)
def search_assets(
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(get_current_auth)],
    q: str | None = None,
    asset_type: AssetType | None = None,
    status: AssetStatus | None = None,
    workspace_id: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    # Authorization applied during query execution (tenant filter always present)
    query = db.query(Asset).filter(Asset.tenant_id == auth.tenant_id)
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(Asset.search_vector.ilike(like))
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if status:
        query = query.filter(Asset.status == status)
    if workspace_id:
        query = query.filter(Asset.workspace_id == workspace_id)

    total = query.count()
    items = (
        query.order_by(Asset.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return AssetListOut(
        items=[_serialize_asset(a, db) for a in items],
        total=total,
        page=page,
        page_size=page_size,
    )
