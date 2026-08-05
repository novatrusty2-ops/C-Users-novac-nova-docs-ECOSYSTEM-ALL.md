# Art City Media Cloud

Unified media infrastructure platform — Phase 1 foundation.

**Vertical slice:** login → resumable upload → checksum → proxy/thumbnail → asset page → search

## Products (later phases)

1. **Art City Archive** — media asset management (this phase)
2. **Kurdistan Stock** — footage licensing marketplace
3. **Art City AI Studio** — AI processing and content workflows

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js / React / TypeScript (`apps/archive-web`) |
| API | FastAPI / Python (`services/api`) |
| Workers | Celery + Redis + FFmpeg (`services/processing-worker`) |
| Database | PostgreSQL |
| Object storage | S3-compatible (MinIO locally) |

## Quick start (Docker)

```bash
cd art-city-media-cloud/infrastructure/docker
cp ../../.env.example ../../.env
docker compose up --build
```

- Archive web: http://localhost:3000
- API docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001

Demo login (seeded): `admin@artcity.example` / `ChangeMeNow!`

## Local development (without Docker)

Requires PostgreSQL, Redis, MinIO (or any S3 endpoint), FFmpeg, and Python 3.11+.

```bash
# API
cd services/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../../.env | xargs)
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --port 8000

# Worker (separate shell)
celery -A app.workers.celery_app worker --loglevel=info

# Web
cd apps/archive-web
npm install
npm run dev
```

## Repository layout

```
apps/archive-web/           Archive UI
services/api/               FastAPI + shared domain + Celery tasks
services/processing-worker/ Worker entry / Dockerfile
packages/schemas/           Shared schema notes
infrastructure/docker/      Compose stack
docs/architecture/          Overview
docs/decisions/             ADRs
```

## Phase 1 acceptance

- Tenant A cannot see Tenant B assets
- Interrupted multipart upload can resume and complete with verified checksum
- Supported video yields technical metadata, proxy, and thumbnail without mutating the original
- Keyword search returns authorized assets only
- Audit trail records upload, metadata changes, and signed delivery URL issuance
