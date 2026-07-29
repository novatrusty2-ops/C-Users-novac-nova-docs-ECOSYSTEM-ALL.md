# Runbook — Phase 1 vertical slice

## Acceptance path

1. Sign in as `admin@artcity.example` / `ChangeMeNow!` (tenant `art-city`)
2. Upload a short MP4 via Archive web or `scripts/e2e_vertical_slice.py`
3. Confirm asset reaches `Ready` with proxy + thumbnail renditions
4. Search for a title keyword and open the asset player

## Local services

```bash
# Postgres, Redis, MinIO must be running (or use docker compose)
cd art-city-media-cloud/services/api
source .venv/bin/activate
export $(grep -v '^#' ../../.env | xargs)
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000
# other shell:
celery -A app.workers.celery_app worker --loglevel=info
# web:
cd ../../apps/archive-web && npm install && npm run dev
```

## Automated checks

```bash
cd services/api
pytest -q
python scripts/e2e_vertical_slice.py
```
