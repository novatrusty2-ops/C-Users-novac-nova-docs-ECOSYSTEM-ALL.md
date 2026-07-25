#!/usr/bin/env bash
# Copy + wire the swap HTTP-200 / seed-books NestJS patch into a local Nova Bank API checkout.
#
# Usage:
#   NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-swap-prod-ready.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH_SRC="$ROOT/patches/nova-bank-api/swap-prod-ready/src"
API_ROOT="${1:-${NOVA_API_ROOT:-}}"

if [[ -z "${API_ROOT}" ]]; then
  cat <<EOF >&2
ERROR: NestJS API root not provided.

  NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-swap-prod-ready.sh
EOF
  exit 2
fi

API_ROOT="$(cd "$API_ROOT" && pwd)"
DEST="$API_ROOT/src/swap-prod-ready"
APP_MODULE=""
for candidate in \
  "$API_ROOT/src/app.module.ts" \
  "$API_ROOT/apps/api/src/app.module.ts"
do
  if [[ -f "$candidate" ]]; then
    APP_MODULE="$candidate"
    break
  fi
done

if [[ ! -d "$PATCH_SRC" ]]; then
  echo "ERROR: patch source missing at $PATCH_SRC" >&2
  exit 1
fi

mkdir -p "$DEST"
cp -R "$PATCH_SRC"/. "$DEST"/
echo "Copied swap-prod-ready patch → $DEST"

if [[ -n "$APP_MODULE" ]]; then
  if grep -q "SwapProdReadyModule" "$APP_MODULE"; then
    echo "SwapProdReadyModule already referenced in $APP_MODULE"
  else
    python3 - "$APP_MODULE" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
import_line = "import { SwapProdReadyModule } from './swap-prod-ready/swap-prod-ready.module';\n"
if "SwapProdReadyModule" in text:
    print("skip — already present")
    raise SystemExit(0)
# Insert import after last import
lines = text.splitlines(keepends=True)
insert_at = 0
for i, line in enumerate(lines):
    if line.startswith("import "):
        insert_at = i + 1
lines.insert(insert_at, import_line)
text2 = "".join(lines)
# Add to @Module imports array
needle = "imports: ["
idx = text2.find(needle)
if idx < 0:
    print("WARN: could not find imports: [ — add SwapProdReadyModule manually")
    path.write_text(text2)
    raise SystemExit(0)
# Insert after imports: [
insert_pos = idx + len(needle)
text2 = text2[:insert_pos] + "\n    SwapProdReadyModule," + text2[insert_pos:]
path.write_text(text2)
print(f"Wired SwapProdReadyModule into {path}")
PY
  fi
else
  echo "WARN: app.module.ts not found — copy succeeded; wire SwapProdReadyModule manually"
fi

cat <<EOF

Next:
  1. In SwapService.onModuleInit, call seedMissingMockBooks(this.books)
     import { seedMissingMockBooks } from './swap-prod-ready/seed-books';
  2. Redeploy Railway nova-bank-api
  3. npm run verify:swap-prod
EOF
