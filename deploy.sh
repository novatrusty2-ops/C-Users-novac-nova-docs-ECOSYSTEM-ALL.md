#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
TARGET="/var/www/anakatechllc-com/signet"
STAGE="${TARGET}.staging.$$"

echo "Building Signet Wallet…"
npm run build --prefix "$ROOT"

echo "Staging to $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE"
rsync -a --delete "$DIST/" "$STAGE/"

echo "Atomic deploy → $TARGET"
mkdir -p "$(dirname "$TARGET")"
if [[ -d "$TARGET" ]]; then
  mv "$TARGET" "${TARGET}.bak"
fi
mv "$STAGE" "$TARGET"
rm -rf "${TARGET}.bak" 2>/dev/null || true

echo "Deploy complete."
