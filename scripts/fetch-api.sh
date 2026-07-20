#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/tmp/api"
BASE="${NOVA_BANK_API:-https://nova-bank-api-production-7311.up.railway.app/api/v1}"
mkdir -p "$OUT"
curl -fsS -m 60 "$BASE/global/status" -o "$OUT/global-status.json"
curl -fsS -m 60 "$BASE/wallet/networks" -o "$OUT/wallet-networks.json"
curl -fsS -m 120 "$BASE/chains/ecosystem/tokens" -o "$OUT/ecosystem-tokens.json"
curl -fsS -m 60 "$BASE/onex/ecosystem" -o "$OUT/onex-ecosystem.json"
curl -fsS -m 60 "$BASE/production-node/status" -o "$OUT/production-node-status.json"
echo "Wrote API snapshots to $OUT"
