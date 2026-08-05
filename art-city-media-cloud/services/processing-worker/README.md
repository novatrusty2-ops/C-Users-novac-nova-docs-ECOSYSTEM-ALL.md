# Processing worker

Celery worker for Art City Media Cloud ingest pipeline.

Uses the same Python package as `services/api` (`app.workers`). Docker builds from the `services/api` context with this Dockerfile.

```bash
celery -A app.workers.celery_app worker --loglevel=info
```
