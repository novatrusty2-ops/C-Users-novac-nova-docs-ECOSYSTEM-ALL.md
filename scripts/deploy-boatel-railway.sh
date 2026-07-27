#!/usr/bin/env bash
# Deploy apps/boatel to Railway.
#
# Requires a Railway project token:
#   export RAILWAY_TOKEN=...
# Optional:
#   export RAILWAY_SERVICE=boatel
#   export RAILWAY_ENVIRONMENT=production
#
# Also set service variables in Railway:
#   NEXTAUTH_SECRET=...
#   NEXTAUTH_URL=https://<your-public-domain>
#   DATABASE_URL=file:/data/boatel.db   (optional; default in image)
# Attach a Railway volume at /data for SQLite persistence.
#
# Usage:
#   bash scripts/deploy-boatel-railway.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/boatel"

if [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "ERROR: Set RAILWAY_TOKEN (project token) or RAILWAY_API_TOKEN (account token)." >&2
  echo "Railway → Project → Settings → Tokens → Create Token" >&2
  echo "Then: export RAILWAY_TOKEN=... && bash scripts/deploy-boatel-railway.sh" >&2
  exit 2
fi

cd "$APP"
echo "Deploying boatel from $APP"

ARGS=(up --detach --yes --path-as-root .)
if [[ -n "${RAILWAY_SERVICE:-}" ]]; then
  ARGS+=(--service "$RAILWAY_SERVICE")
fi
if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
  ARGS+=(--environment "$RAILWAY_ENVIRONMENT")
fi

npx --yes @railway/cli@5.28.1 "${ARGS[@]}"

echo "Deploy kicked off."
echo "Set NEXTAUTH_URL to the public HTTPS domain, attach volume /data,"
echo "then smoke: curl -sS https://<domain>/api/health"
