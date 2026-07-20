#!/usr/bin/env bash
# Automatically copy + wire the OpenPayd EMI NestJS patch into a local Nova Bank API checkout.
#
# Usage:
#   NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-openpayd-emi.sh
#   bash scripts/install-openpayd-emi.sh /path/to/nova/apps/api
#
# This does NOT set Railway secrets or OpenPayd credentials (those must come from
# the OpenPayd portal / Railway dashboard).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH_SRC="$ROOT/patches/nova-bank-api/openpayd-emi/src"
API_ROOT="${1:-${NOVA_API_ROOT:-}}"

if [[ -z "${API_ROOT}" ]]; then
  cat <<EOF >&2
ERROR: NestJS API root not provided.

This ecosystem repo does not contain the Nova Bank NestJS application.
Pass the API path so the patch can be installed automatically:

  NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-openpayd-emi.sh

Or:

  bash scripts/install-openpayd-emi.sh /path/to/nova/apps/api
EOF
  exit 2
fi

API_ROOT="$(cd "$API_ROOT" && pwd)"
DEST="$API_ROOT/src/openpayd"
APP_MODULE=""
for candidate in \
  "$API_ROOT/src/app.module.ts" \
  "$API_ROOT/apps/api/src/app.module.ts" \
  "$API_ROOT/src/app.module.js"
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
echo "Copied OpenPayd patch → $DEST"

if [[ -n "$APP_MODULE" ]]; then
  if grep -q "OpenPaydModule" "$APP_MODULE"; then
    echo "OpenPaydModule already referenced in $APP_MODULE"
  else
    # Insert import after the last existing import line.
    python3 - "$APP_MODULE" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
import_line = "import { OpenPaydModule } from './openpayd/openpayd.module';\n"
# Prefer relative path from src/
if "/apps/api/src/" in str(path) or path.name == "app.module.ts":
    # If openpayd sits next to app.module, './openpayd/...' is correct.
    pass
if "OpenPaydModule" in text:
    print("skip import — already present")
    raise SystemExit(0)
lines = text.splitlines(keepends=True)
insert_at = 0
for i, line in enumerate(lines):
    if line.startswith("import "):
        insert_at = i + 1
lines.insert(insert_at, import_line)
text2 = "".join(lines)
# Add to imports array if present
needle = "imports: ["
if needle in text2 and "OpenPaydModule.register()" not in text2:
    text2 = text2.replace(needle, "imports: [\n    OpenPaydModule.register(),", 1)
path.write_text(text2)
print(f"Wired OpenPaydModule into {path}")
PY
  fi
else
  echo "WARNING: app.module.ts not found under $API_ROOT — copy succeeded; wire OpenPaydModule manually." >&2
fi

# Ensure rawBody note is printed (cannot safely rewrite main.ts automatically).
cat <<EOF

Install complete (files on disk).

Next (manual — cannot be done from this ecosystem repo alone):
  1. In NestJS main.ts use: NestFactory.create(AppModule, { rawBody: true })
  2. Set Railway env from $ROOT/.env.example (OPENPAYD_* / EMI_OPENPAYD_API_KEY)
  3. Deploy NestJS API to Railway
  4. Smoke-test:
       curl -sS \$NOVA_API/openpayd/status | jq .
       curl -sS -H "X-Admin-Key: \$ADMIN_API_KEY" \$NOVA_API/openpayd/health | jq .

OpenPayd username/password/IBAN are NOT available in git — set them in Railway.
EOF
