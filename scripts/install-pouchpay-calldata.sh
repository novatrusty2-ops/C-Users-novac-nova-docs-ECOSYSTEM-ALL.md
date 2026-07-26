#!/usr/bin/env bash
# Install patches/nova-bank-api/pouchpay-calldata into a nova-bank-api checkout.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/patches/nova-bank-api/pouchpay-calldata/src"
DEST="${1:-}"
if [[ -z "$DEST" ]]; then
  echo "Usage: $0 /path/to/nova-bank-api" >&2
  exit 1
fi
TARGET="$DEST/src/pouchpay-calldata"
mkdir -p "$TARGET"
cp -v "$SRC"/* "$TARGET/"
echo "Copied patch to $TARGET"
echo "Next: import { PouchpayCalldataModule } from './pouchpay-calldata' in AppModule"
echo "Set POUCHPAY_BRIDGE_URL to your deployed pouchpay-bridge origin"
