from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.config import Settings, get_settings
from app.db import get_db
from app.models import Asset, AssetStatus, AssetVersion, FileObject, Rendition, Role
from app.schemas import AssetCreate, AssetListOut, AssetOut, AssetUpdate, FileOut, RenditionOut
from app.security import AuthContext, get_current_auth, require_roles
from app.storage import presign_get

router = APIRouter(prefix="/assets", tags=["assets"])


def _serialize_asset(asset: Asset, db: Session, include_urls: bool = True) -> AssetOut:
    renditions = (
        db.query(Rendition)
        .filter(Rendition.asset_id == asset.id, Rendition.tenant_id == asset.tenant_id)
        .all()
    )
    versions = (
        db.query(AssetVersion)
        .filter(AssetVersion.asset_id == asset.id, AssetVersion.tenant_id == asset.tenant_id)
        .order_by(AssetVersion.version_number.desc())
        .all()
    )
    files: list[FileObject] = []
    if versions:
        files = (
            db.query(FileObject)
            .filter(FileObject.version_id == versions[0].id, FileObject.tenant_id == asset.tenant_id)
            .all()
        )

    rendition_out = []
    for r in renditions:
        url = presign_get(r.object_key) if include_urls else None
        rendition_out.append(
            RenditionOut(
                id=r.id,
                profile=r.profile,
                object_key=r.object_key,
                codec=r.codec,
                resolution=r.resolution,
                duration_seconds=r.duration_seconds,
                mime_type=r.mime_type,
                size_bytes=r.size_bytes,
                url=url,
            )
        )

    return AssetOut(
        id=asset.id,
        tenant_id=asset.tenant_id,
        workspace_id=asset.workspace_id,
        title=asset.title,
        description=asset.description,
        asset_type=asset.asset_type,
        status=asset.status,
        owner_user_id=asset.owner_user_id,
        primary_language=asset.primary_language,
        sensitivity=asset.sensitivity,
        technical_metadata=asset.technical_metadata,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        renditions=rendition_out,
        files=[
            FileOut(
                id=f.id,
                filename=f.filename,
                size_bytes=f.size_bytes,
                mime_type=f.mime_type,
                checksum_sha256=f.checksum_sha256,
                upload_status=f.upload_status,
                is_original=f.is_original,
            )
            for f in files
        ],
    )


@router.post("", response_model=AssetOut, status_code=201)
def create_asset(
    body: AssetCreate,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(require_roles(Role.editor, Role.archivist, Role.contributor, Role.tenant_admin))],
):
    asset = Asset(
        tenant_id=auth.tenant_id,
        workspace_id=body.workspace_id,
        title=body.title,
        description=body.description,
        asset_type=body.asset_type,
        status=AssetStatus.created,
        owner_user_id=auth.user.id,
        primary_language=body.primary_language,
        sensitivity=body.sensitivity,
        search_vector=f"{body.title} {body.description}".strip().lower(),
    )
    db.add(asset)
    db.flush()
    version = AssetVersion(
        tenant_id=auth.tenant_id,
        asset_id=asset.id,
        version_number=1,
        change_reason="initial",
        created_by=auth.user.id,
    )
    db.add(version)
    write_audit(
        db,
        auth=auth,
        action="asset.create",
        object_type="asset",
        object_id=str(asset.id),
        after_ref={"title": asset.title, "status": asset.status.value},
    )
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset, db)


@router.get("", response_model=AssetListOut)
def list_assets(
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(get_current_auth)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: AssetStatus | None = None,
    q: str | None = None,
):
    query = db.query(Asset).filter(Asset.tenant_id == auth.tenant_id)
    if status:
        query = query.filter(Asset.status == status)
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(Asset.search_vector.ilike(like))
    total = query.count()
    items = (
        query.order_by(Asset.created_at.desc())
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


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(
    asset_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(get_current_auth)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.tenant_id == auth.tenant_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    out = _serialize_asset(asset, db)
    # Audit delivery URL issuance when signed URLs are present
    if out.renditions:
        write_audit(
            db,
            auth=auth,
            action="delivery.url_issued",
            object_type="asset",
            object_id=str(asset.id),
            after_ref={"rendition_count": len(out.renditions), "expires": settings.signed_url_expire_seconds},
        )
        db.commit()
    return out


@router.patch("/{asset_id}", response_model=AssetOut)
def update_asset(
    asset_id: uuid.UUID,
    body: AssetUpdate,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(require_roles(Role.editor, Role.archivist, Role.tenant_admin))],
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.tenant_id == auth.tenant_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    before = {"title": asset.title, "description": asset.description}
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(asset, key, value)
    asset.search_vector = f"{asset.title} {asset.description}".strip().lower()
    write_audit(
        db,
        auth=auth,
        action="asset.update",
        object_type="asset",
        object_id=str(asset.id),
        before_ref=before,
        after_ref={"title": asset.title, "description": asset.description},
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset, db)
