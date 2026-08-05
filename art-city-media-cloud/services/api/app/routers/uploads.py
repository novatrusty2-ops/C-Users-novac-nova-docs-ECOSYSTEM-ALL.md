from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.config import Settings, get_settings
from app.db import get_db
from app.models import (
    Asset,
    AssetStatus,
    AssetVersion,
    FileObject,
    JobStatus,
    ProcessingJob,
    Role,
    UploadSession,
    UploadStatus,
)
from app.schemas import (
    JobOut,
    UploadCompleteRequest,
    UploadCreate,
    UploadPartOut,
    UploadSessionOut,
)
from app.security import AuthContext, require_roles
from app.storage import (
    complete_multipart_upload,
    create_multipart_upload,
    ensure_bucket,
    quarantine_key,
    presign_put_part,
)
from app.workers.tasks import process_ingest

router = APIRouter(prefix="/uploads", tags=["uploads"])


def _part_count(size_bytes: int, part_size: int) -> int:
    return max(1, math.ceil(size_bytes / part_size))


def _session_out(session: UploadSession, settings: Settings) -> UploadSessionOut:
    count = _part_count(session.size_bytes, session.part_size_bytes)
    parts = [
        UploadPartOut(
            part_number=n,
            url=presign_put_part(
                object_key=session.object_key,
                upload_id=session.s3_upload_id,
                part_number=n,
                expires=settings.signed_url_expire_seconds,
            ),
            expires_in=settings.signed_url_expire_seconds,
        )
        for n in range(1, count + 1)
    ]
    return UploadSessionOut(
        id=session.id,
        asset_id=session.asset_id,
        file_id=session.file_id,
        filename=session.filename,
        size_bytes=session.size_bytes,
        part_size_bytes=session.part_size_bytes,
        part_count=count,
        status=session.status,
        parts=parts,
    )


@router.post("", response_model=UploadSessionOut, status_code=201)
def create_upload(
    body: UploadCreate,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(require_roles(Role.editor, Role.archivist, Role.contributor, Role.tenant_admin))],
    settings: Annotated[Settings, Depends(get_settings)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
):
    key = body.idempotency_key or idempotency_key
    if key:
        existing = (
            db.query(UploadSession)
            .filter(
                UploadSession.tenant_id == auth.tenant_id,
                UploadSession.idempotency_key == key,
            )
            .first()
        )
        if existing:
            return _session_out(existing, settings)

    asset = db.query(Asset).filter(Asset.id == body.asset_id, Asset.tenant_id == auth.tenant_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    version = (
        db.query(AssetVersion)
        .filter(AssetVersion.asset_id == asset.id, AssetVersion.tenant_id == auth.tenant_id)
        .order_by(AssetVersion.version_number.desc())
        .first()
    )
    if not version:
        raise HTTPException(status_code=400, detail="Asset has no version")

    ensure_bucket(settings)
    upload_id_placeholder = uuid.uuid4()
    object_key = quarantine_key(auth.tenant_id, upload_id_placeholder, body.filename)
    s3_upload_id = create_multipart_upload(object_key, body.mime_type)

    file_obj = FileObject(
        tenant_id=auth.tenant_id,
        version_id=version.id,
        storage_location="s3",
        object_key=object_key,
        filename=body.filename,
        size_bytes=body.size_bytes,
        mime_type=body.mime_type,
        upload_status=UploadStatus.uploading,
        is_original=True,
    )
    db.add(file_obj)
    db.flush()

    session = UploadSession(
        id=upload_id_placeholder,
        tenant_id=auth.tenant_id,
        asset_id=asset.id,
        version_id=version.id,
        file_id=file_obj.id,
        s3_upload_id=s3_upload_id,
        object_key=object_key,
        filename=body.filename,
        mime_type=body.mime_type,
        size_bytes=body.size_bytes,
        part_size_bytes=settings.upload_part_size_bytes,
        status=UploadStatus.uploading,
        idempotency_key=key,
        created_by=auth.user.id,
    )
    asset.status = AssetStatus.uploading
    db.add(session)
    db.add(asset)
    write_audit(
        db,
        auth=auth,
        action="upload.create",
        object_type="upload_session",
        object_id=str(session.id),
        after_ref={"asset_id": str(asset.id), "filename": body.filename, "size_bytes": body.size_bytes},
    )
    db.commit()
    db.refresh(session)
    return _session_out(session, settings)


@router.get("/{upload_id}", response_model=UploadSessionOut)
def get_upload(
    upload_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(require_roles(Role.editor, Role.archivist, Role.contributor, Role.tenant_admin))],
    settings: Annotated[Settings, Depends(get_settings)],
):
    session = (
        db.query(UploadSession)
        .filter(UploadSession.id == upload_id, UploadSession.tenant_id == auth.tenant_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found")
    # Re-issue part URLs to support resume after expiry
    return _session_out(session, settings)


@router.post("/{upload_id}/complete", response_model=JobOut)
def complete_upload(
    upload_id: uuid.UUID,
    body: UploadCompleteRequest,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(require_roles(Role.editor, Role.archivist, Role.contributor, Role.tenant_admin))],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
):
    session = (
        db.query(UploadSession)
        .filter(UploadSession.id == upload_id, UploadSession.tenant_id == auth.tenant_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found")

    if session.status == UploadStatus.completed:
        job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.file_id == session.file_id, ProcessingJob.tenant_id == auth.tenant_id)
            .order_by(ProcessingJob.created_at.desc())
            .first()
        )
        if job:
            return job
        raise HTTPException(status_code=409, detail="Upload completed but job missing")

    if not body.parts:
        raise HTTPException(status_code=400, detail="parts required")

    parts = [{"ETag": p.etag.strip('"'), "PartNumber": p.part_number} for p in sorted(body.parts, key=lambda x: x.part_number)]
    # boto/MinIO often need ETags as returned; keep quotes stripped
    parts = [{"ETag": p["ETag"] if p["ETag"].startswith('"') else f'"{p["ETag"]}"', "PartNumber": p["PartNumber"]} for p in parts]

    try:
        complete_multipart_upload(session.object_key, session.s3_upload_id, parts)
    except Exception as exc:
        session.status = UploadStatus.failed
        db.add(session)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Multipart complete failed: {exc}") from exc

    file_obj = db.get(FileObject, session.file_id)
    asset = db.get(Asset, session.asset_id)
    if not file_obj or not asset:
        raise HTTPException(status_code=500, detail="Upload linked records missing")

    file_obj.checksum_sha256 = body.checksum_sha256.lower()
    file_obj.upload_status = UploadStatus.completed
    session.status = UploadStatus.completed
    session.completed_at = datetime.now(timezone.utc)
    session.parts_json = {"parts": [p.model_dump() for p in body.parts]}
    if idempotency_key and not session.idempotency_key:
        session.idempotency_key = idempotency_key
    asset.status = AssetStatus.uploaded

    job = ProcessingJob(
        tenant_id=auth.tenant_id,
        asset_id=asset.id,
        file_id=file_obj.id,
        operation="ingest_pipeline",
        status=JobStatus.queued,
        progress=0.0,
        correlation_id=auth.correlation_id,
    )
    db.add(file_obj)
    db.add(session)
    db.add(asset)
    db.add(job)
    write_audit(
        db,
        auth=auth,
        action="upload.complete",
        object_type="upload_session",
        object_id=str(session.id),
        after_ref={"checksum_sha256": body.checksum_sha256.lower(), "asset_id": str(asset.id)},
    )
    db.commit()
    db.refresh(job)

    async_result = process_ingest.delay(str(job.id))
    job.celery_task_id = async_result.id
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
