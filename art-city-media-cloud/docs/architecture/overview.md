# Architecture Overview — Phase 1

Art City Media Cloud Phase 1 establishes a single platform foundation: one identity system, one asset graph, one audit trail. Binaries live in S3-compatible object storage; PostgreSQL is the source of truth for metadata and workflow state.

## Services

| Service | Role |
|---------|------|
| `archive-web` | Next.js UI for login, library, upload, asset detail |
| `api` | FastAPI REST `/api/v1` — auth, assets, uploads, search, jobs, audit |
| `processing-worker` | Celery worker — checksum verify, MediaInfo/ffprobe, FFmpeg proxy + thumbnail |

## Data flow (vertical slice)

1. User authenticates; JWT carries `user_id`, `tenant_id`, `role`.
2. Client creates an asset, then an upload session.
3. Client uploads parts to MinIO via signed URLs; completes with client checksum.
4. API marks asset `Uploaded`, enqueues processing job.
5. Worker verifies SHA-256, probes technical metadata, writes proxy + thumbnail renditions.
6. Asset becomes `Ready`; search indexes title/description via PostgreSQL full-text.
7. UI streams proxy through a short-lived signed URL issued by the API.

## Storage prefixes

See [ADR-001](../decisions/001-storage-layout.md).

## Security baseline

- Tenant-scoped RBAC on every query
- No public object URLs
- Original media immutable (new version on replace)
- Append-only audit events for login, upload, metadata change, delivery URL issue
