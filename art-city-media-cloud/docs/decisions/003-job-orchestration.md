# ADR-003: Job orchestration

## Status
Accepted (Phase 1)

## Context
Media processing is asynchronous and CPU-heavy. Temporal is preferable for complex long-running workflows later, but adds operational weight for Phase 1.

## Decision
- Redis + Celery for Phase 1 media jobs
- Job records in PostgreSQL (`processing_jobs`) for user-visible status, progress, retries, and errors
- Celery task id stored on the job for correlation
- Pipeline steps: checksum verify → technical probe → proxy → thumbnail → Ready

## Consequences
Horizontal worker scaling is straightforward. When workflows become multi-step with human gates (rights, AI approval), migrate orchestration to Temporal while keeping the same job table as the UI contract.
