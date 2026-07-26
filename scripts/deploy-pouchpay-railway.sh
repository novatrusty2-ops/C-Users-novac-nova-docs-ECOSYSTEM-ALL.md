#!/usr/bin/env bash
# Deploy apps/pouchpay-bridge to Railway (Nest-shaped quotes with callData).
#
# Requires a Railway project token (Project Settings → Tokens):
#   export RAILWAY_TOKEN=...
# Optional:
#   export RAILWAY_SERVICE=pouchpay-bridge
#   export RAILWAY_ENVIRONMENT=production
#
# Usage:
#   bash scripts/deploy-pouchpay-railway.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/pouchpay-bridge"

if [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "ERROR: Set RAILWAY_TOKEN (project token) or RAILWAY_API_TOKEN (account token)." >&2
  echo "Railway → Project → Settings → Tokens → Create Token" >&2
  echo "Then: export RAILWAY_TOKEN=... && bash scripts/deploy-pouchpay-railway.sh" >&2
  exit 2
fi

cd "$APP"
echo "Deploying pouchpay-bridge from $APP"

ARGS=(up --detach --path .)
if [[ -n "${RAILWAY_SERVICE:-}" ]]; then
  ARGS+=(--service "$RAILWAY_SERVICE")
fi
if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
  ARGS+=(--environment "$RAILWAY_ENVIRONMENT")
fi

npx --yes @railway/cli@5.28.1 "${ARGS[@]}"

echo "Deploy kicked off. Generate/confirm public domain in Railway → Networking,"
echo "then point VITE_POUCHPAY_API_BASE / api.pouchpay.io quoteApi at that origin."
echo "Smoke: curl -sS https://<domain>/health | jq ."
