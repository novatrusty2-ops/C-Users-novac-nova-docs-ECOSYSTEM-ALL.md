from __future__ import annotations

import logging
import tempfile
import uuid
from pathlib import Path

from app.db import SessionLocal
from app.media import generate_proxy, generate_thumbnail, probe_media, sha256_file
from app.models import Asset, AssetStatus, FileObject, JobStatus, ProcessingJob, Rendition
from app.storage import (
    copy_object,
    delete_object,
    download_file,
    original_key,
    proxy_key,
    thumb_key,
    upload_file,
)
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _update_job(db, job: ProcessingJob, *, status: JobStatus | None = None, progress: float | None = None, error: str | None = None):
    if status is not None:
        job.status = status
    if progress is not None:
        job.progress = progress
    if error is not None:
        job.error_message = error
    db.add(job)
    db.commit()


@celery_app.task(bind=True, name="artcity.process_ingest")
def process_ingest(self, job_id: str) -> dict:
    db = SessionLocal()
    try:
        job = db.get(ProcessingJob, uuid.UUID(job_id))
        if not job:
            return {"ok": False, "error": "job_not_found"}

        job.celery_task_id = self.request.id
        _update_job(db, job, status=JobStatus.running, progress=0.05)

        asset = db.get(Asset, job.asset_id)
        file_obj = db.get(FileObject, job.file_id)
        if not asset or not file_obj:
            _update_job(db, job, status=JobStatus.failed, error="asset_or_file_missing")
            return {"ok": False, "error": "asset_or_file_missing"}

        with tempfile.TemporaryDirectory(prefix="artcity-") as tmp:
            tmp_path = Path(tmp)
            local_source = tmp_path / file_obj.filename
            download_file(file_obj.object_key, str(local_source))
            _update_job(db, job, progress=0.2)

            # Checksum verify
            digest = sha256_file(local_source)
            if file_obj.checksum_sha256 and file_obj.checksum_sha256.lower() != digest.lower():
                asset.status = AssetStatus.quarantine
                db.add(asset)
                _update_job(db, job, status=JobStatus.failed, error="checksum_mismatch", progress=1.0)
                return {"ok": False, "error": "checksum_mismatch"}

            file_obj.checksum_sha256 = digest
            asset.status = AssetStatus.checksum_verified
            db.add(file_obj)
            db.add(asset)
            db.commit()
            _update_job(db, job, progress=0.35)

            # If still in quarantine prefix, promote to originals
            if file_obj.object_key.startswith("quarantine/"):
                dest = original_key(asset.tenant_id, asset.id, file_obj.version_id, file_obj.filename)
                copy_object(file_obj.object_key, dest)
                delete_object(file_obj.object_key)
                file_obj.object_key = dest
                db.add(file_obj)
                db.commit()
                # re-download not needed; local file already present

            # Technical probe
            asset.status = AssetStatus.technical_probe
            db.add(asset)
            db.commit()
            tech = probe_media(local_source)
            # Drop bulky raw for storage size control; keep summary
            summary = {k: v for k, v in tech.items() if k != "raw"}
            summary["probe_tool"] = tech.get("probe_tool")
            asset.technical_metadata = summary
            db.add(asset)
            db.commit()
            _update_job(db, job, progress=0.5)

            # Proxy + thumbnail for video/audio/image where ffmpeg can handle
            asset.status = AssetStatus.proxy_generation
            db.add(asset)
            db.commit()

            is_image = (file_obj.mime_type or "").startswith("image/")
            proxy_path = tmp_path / "proxy.mp4"
            thumb_path = tmp_path / "thumb.jpg"

            try:
                if is_image:
                    # For images, thumbnail is a scaled jpeg; proxy skipped
                    generate_thumbnail(local_source, thumb_path, at_seconds=0)
                else:
                    generate_proxy(local_source, proxy_path)
                    generate_thumbnail(local_source, thumb_path, at_seconds=min(1.0, summary.get("duration_seconds") or 1.0))
            except Exception as exc:
                logger.exception("media generation failed")
                asset.status = AssetStatus.failed
                db.add(asset)
                _update_job(db, job, status=JobStatus.failed, error=str(exc)[:2000], progress=1.0)
                return {"ok": False, "error": str(exc)}

            _update_job(db, job, progress=0.8)

            # Clear prior renditions for this asset/profile (idempotent reprocess)
            db.query(Rendition).filter(
                Rendition.asset_id == asset.id,
                Rendition.profile.in_(["proxy", "thumbnail"]),
            ).delete(synchronize_session=False)

            if proxy_path.exists():
                p_key = proxy_key(asset.tenant_id, asset.id, file_obj.version_id)
                upload_file(str(proxy_path), p_key, "video/mp4")
                db.add(
                    Rendition(
                        tenant_id=asset.tenant_id,
                        asset_id=asset.id,
                        source_file_id=file_obj.id,
                        profile="proxy",
                        object_key=p_key,
                        codec="h264",
                        resolution=summary.get("resolution"),
                        duration_seconds=summary.get("duration_seconds"),
                        mime_type="video/mp4",
                        size_bytes=proxy_path.stat().st_size,
                        generated_by_job_id=job.id,
                    )
                )

            if thumb_path.exists():
                t_key = thumb_key(asset.tenant_id, asset.id, file_obj.version_id)
                upload_file(str(thumb_path), t_key, "image/jpeg")
                db.add(
                    Rendition(
                        tenant_id=asset.tenant_id,
                        asset_id=asset.id,
                        source_file_id=file_obj.id,
                        profile="thumbnail",
                        object_key=t_key,
                        codec="mjpeg",
                        resolution=None,
                        duration_seconds=None,
                        mime_type="image/jpeg",
                        size_bytes=thumb_path.stat().st_size,
                        generated_by_job_id=job.id,
                    )
                )

            asset.status = AssetStatus.ready
            asset.search_vector = f"{asset.title} {asset.description}".strip().lower()
            db.add(asset)
            db.commit()
            _update_job(db, job, status=JobStatus.succeeded, progress=1.0)
            return {"ok": True, "asset_id": str(asset.id), "checksum": digest}
    except Exception as exc:
        logger.exception("ingest pipeline failed")
        try:
            job = db.get(ProcessingJob, uuid.UUID(job_id))
            if job:
                asset = db.get(Asset, job.asset_id)
                if asset:
                    asset.status = AssetStatus.failed
                    db.add(asset)
                _update_job(db, job, status=JobStatus.failed, error=str(exc)[:2000], progress=1.0)
        except Exception:
            logger.exception("failed to persist job failure")
        return {"ok": False, "error": str(exc)}
    finally:
        db.close()
