from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ProcessingJob
from app.schemas import JobOut
from app.security import AuthContext, get_current_auth

router = APIRouter(prefix="/ai-jobs", tags=["jobs"])


# Spec uses /ai-jobs for AI; Phase 1 exposes processing jobs under /jobs as well.
jobs_router = APIRouter(prefix="/jobs", tags=["jobs"])


@jobs_router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    auth: Annotated[AuthContext, Depends(get_current_auth)],
):
    job = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.id == job_id, ProcessingJob.tenant_id == auth.tenant_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
