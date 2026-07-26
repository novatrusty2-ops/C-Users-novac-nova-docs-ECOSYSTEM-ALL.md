#!/usr/bin/env bash
# Install Nest pouchpay-calldata patch into a nova-bank-api checkout and wire AppModule.
#
# Usage:
#   bash scripts/install-and-wire-pouchpay-calldata.sh /path/to/nova-bank-api
#   NOVA_BANK_API_GIT_URL=https://github.com/ORG/nova-bank-api.git \
#     bash scripts/install-and-wire-pouchpay-calldata.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/patches/nova-bank-api/pouchpay-calldata/src"
DEST="${1:-}"

if [[ -z "$DEST" && -n "${NOVA_BANK_API_GIT_URL:-}" ]]; then
  DEST="${NOVA_BANK_API_DIR:-$ROOT/.tmp/nova-bank-api}"
  if [[ ! -d "$DEST/.git" ]]; then
    rm -rf "$DEST"
    git clone --depth 1 "$NOVA_BANK_API_GIT_URL" "$DEST"
  fi
fi

if [[ -z "$DEST" || ! -d "$DEST" ]]; then
  echo "Usage: $0 /path/to/nova-bank-api" >&2
  echo "   or: NOVA_BANK_API_GIT_URL=https://github.com/ORG/nova-bank-api.git $0" >&2
  exit 1
fi

TARGET="$DEST/src/pouchpay-calldata"
mkdir -p "$TARGET"
cp -v "$SRC"/* "$TARGET/"

# Wire AppModule if present and not already imported
APP_MODULE="$(find "$DEST/src" -maxdepth 3 -name 'app.module.ts' | head -n1 || true)"
if [[ -n "$APP_MODULE" ]]; then
  if grep -q 'PouchpayCalldataModule' "$APP_MODULE"; then
    echo "AppModule already imports PouchpayCalldataModule ($APP_MODULE)"
  else
    # Compute relative import from app.module.ts → pouchpay-calldata
    APP_DIR="$(dirname "$APP_MODULE")"
    REL_PATH="$(python3 - <<PY
import os
print(os.path.relpath("$TARGET", "$APP_DIR").replace(os.sep, "/"))
PY
)"
    python3 - <<PY
from pathlib import Path
path = Path("$APP_MODULE")
text = path.read_text()
imp = "import { PouchpayCalldataModule } from './${REL_PATH}'\n".replace("/index", "")
# Prefer folder import without trailing filename
imp = imp.replace("pouchpay-calldata/index'", "pouchpay-calldata'")
if "PouchpayCalldataModule" in text:
    print("skip wire — already present")
else:
    # Insert import after last import line
    lines = text.splitlines(True)
    last_imp = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_imp = i
    lines.insert(last_imp + 1, imp if imp.endswith("\n") else imp + "\n")
    text2 = "".join(lines)
    # Insert into imports: [ ... ] array of @Module
    import re
    m = re.search(r"imports\s*:\s*\[", text2)
    if not m:
        raise SystemExit(f"Could not find imports: [] in {path}")
    idx = m.end()
    text2 = text2[:idx] + "\n    PouchpayCalldataModule," + text2[idx:]
    path.write_text(text2)
    print(f"Wired PouchpayCalldataModule into {path}")
PY
  fi
else
  echo "WARN: no app.module.ts found under $DEST/src — copy succeeded; import manually."
fi

echo
echo "Installed patch into $TARGET"
echo "Env for Railway / Nest host:"
echo "  ALLTRA_RPC=https://mainnet-rpc.alltra.global"
echo "  # optional: POUCHPAY_BRIDGE_URL=https://<pouchpay-bridge>.up.railway.app"
echo "Redeploy the Nova Bank service after commit/push of this checkout."
