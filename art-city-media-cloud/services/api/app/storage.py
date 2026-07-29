from __future__ import annotations

import uuid
from functools import lru_cache

import boto3
from botocore.client import Config

from app.config import Settings, get_settings


@lru_cache
def get_s3_client(endpoint_url: str | None = None):
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url or settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def get_public_s3_client():
    settings = get_settings()
    return get_s3_client(endpoint_url=settings.s3_public_endpoint_url)


def ensure_bucket(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except Exception:
        client.create_bucket(Bucket=settings.s3_bucket)


def quarantine_key(tenant_id: uuid.UUID, upload_id: uuid.UUID, filename: str) -> str:
    safe = filename.replace("/", "_").replace("\\", "_")
    return f"quarantine/{tenant_id}/{upload_id}/{safe}"


def original_key(tenant_id: uuid.UUID, asset_id: uuid.UUID, version_id: uuid.UUID, filename: str) -> str:
    safe = filename.replace("/", "_").replace("\\", "_")
    return f"originals/{tenant_id}/{asset_id}/{version_id}/{safe}"


def proxy_key(tenant_id: uuid.UUID, asset_id: uuid.UUID, version_id: uuid.UUID) -> str:
    return f"proxies/{tenant_id}/{asset_id}/{version_id}/proxy.mp4"


def thumb_key(tenant_id: uuid.UUID, asset_id: uuid.UUID, version_id: uuid.UUID) -> str:
    return f"thumbs/{tenant_id}/{asset_id}/{version_id}/thumb.jpg"


def presign_put_part(
    *,
    object_key: str,
    upload_id: str,
    part_number: int,
    expires: int,
) -> str:
    settings = get_settings()
    client = get_public_s3_client()
    return client.generate_presigned_url(
        "upload_part",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": object_key,
            "UploadId": upload_id,
            "PartNumber": part_number,
        },
        ExpiresIn=expires,
    )


def presign_get(object_key: str, expires: int | None = None) -> str:
    settings = get_settings()
    client = get_public_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": object_key},
        ExpiresIn=expires or settings.signed_url_expire_seconds,
    )


def create_multipart_upload(object_key: str, mime_type: str) -> str:
    settings = get_settings()
    client = get_s3_client()
    resp = client.create_multipart_upload(
        Bucket=settings.s3_bucket,
        Key=object_key,
        ContentType=mime_type,
    )
    return resp["UploadId"]


def complete_multipart_upload(object_key: str, upload_id: str, parts: list[dict]) -> None:
    settings = get_settings()
    client = get_s3_client()
    client.complete_multipart_upload(
        Bucket=settings.s3_bucket,
        Key=object_key,
        UploadId=upload_id,
        MultipartUpload={"Parts": parts},
    )


def copy_object(source_key: str, dest_key: str) -> None:
    settings = get_settings()
    client = get_s3_client()
    client.copy_object(
        Bucket=settings.s3_bucket,
        CopySource={"Bucket": settings.s3_bucket, "Key": source_key},
        Key=dest_key,
    )


def delete_object(object_key: str) -> None:
    settings = get_settings()
    client = get_s3_client()
    client.delete_object(Bucket=settings.s3_bucket, Key=object_key)


def download_file(object_key: str, local_path: str) -> None:
    settings = get_settings()
    client = get_s3_client()
    client.download_file(settings.s3_bucket, object_key, local_path)


def upload_file(local_path: str, object_key: str, mime_type: str) -> None:
    settings = get_settings()
    client = get_s3_client()
    client.upload_file(
        local_path,
        settings.s3_bucket,
        object_key,
        ExtraArgs={"ContentType": mime_type},
    )


def head_object(object_key: str) -> dict:
    settings = get_settings()
    client = get_s3_client()
    return client.head_object(Bucket=settings.s3_bucket, Key=object_key)
