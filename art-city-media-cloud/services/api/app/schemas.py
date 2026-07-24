from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.models import AssetStatus, AssetType, JobStatus, Role, Sensitivity, UploadStatus


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_slug: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    tenant_name: str
    tenant_slug: str = Field(min_length=2, max_length=100)


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    tenant_id: uuid.UUID
    tenant_slug: str
    role: Role

    model_config = {"from_attributes": True}


class WorkspaceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class AssetCreate(BaseModel):
    title: str
    description: str = ""
    asset_type: AssetType = AssetType.video
    workspace_id: uuid.UUID | None = None
    primary_language: str = "en"
    sensitivity: Sensitivity = Sensitivity.internal


class AssetUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    primary_language: str | None = None
    sensitivity: Sensitivity | None = None
    workspace_id: uuid.UUID | None = None


class RenditionOut(BaseModel):
    id: uuid.UUID
    profile: str
    object_key: str
    codec: str | None
    resolution: str | None
    duration_seconds: float | None
    mime_type: str
    size_bytes: int
    url: str | None = None

    model_config = {"from_attributes": True}


class FileOut(BaseModel):
    id: uuid.UUID
    filename: str
    size_bytes: int
    mime_type: str
    checksum_sha256: str | None
    upload_status: UploadStatus
    is_original: bool

    model_config = {"from_attributes": True}


class AssetOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID | None
    title: str
    description: str
    asset_type: AssetType
    status: AssetStatus
    owner_user_id: uuid.UUID
    primary_language: str
    sensitivity: Sensitivity
    technical_metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    renditions: list[RenditionOut] = []
    files: list[FileOut] = []

    model_config = {"from_attributes": True}


class AssetListOut(BaseModel):
    items: list[AssetOut]
    total: int
    page: int
    page_size: int


class UploadCreate(BaseModel):
    asset_id: uuid.UUID
    filename: str
    size_bytes: int = Field(gt=0)
    mime_type: str = "application/octet-stream"
    idempotency_key: str | None = None


class UploadPartOut(BaseModel):
    part_number: int
    url: str
    expires_in: int


class UploadSessionOut(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    file_id: uuid.UUID
    filename: str
    size_bytes: int
    part_size_bytes: int
    part_count: int
    status: UploadStatus
    parts: list[UploadPartOut]

    model_config = {"from_attributes": True}


class UploadCompletePart(BaseModel):
    part_number: int
    etag: str


class UploadCompleteRequest(BaseModel):
    parts: list[UploadCompletePart]
    checksum_sha256: str = Field(min_length=64, max_length=64)
    idempotency_key: str | None = None


class JobOut(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    operation: str
    status: JobStatus
    progress: float
    error_message: str | None
    correlation_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AuditEventOut(BaseModel):
    id: uuid.UUID
    action: str
    object_type: str
    object_id: str | None
    created_at: datetime
    actor_user_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class ErrorOut(BaseModel):
    detail: str
    correlation_id: str | None = None
