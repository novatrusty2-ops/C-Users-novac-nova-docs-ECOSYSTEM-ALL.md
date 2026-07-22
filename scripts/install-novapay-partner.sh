#!/usr/bin/env bash
# Copy + wire the NovaPay partner NestJS patch into a local Nova Bank API checkout.
#
# Usage:
#   NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-novapay-partner.sh
#   bash scripts/install-novapay-partner.sh /path/to/nova/apps/api

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH_SRC="$ROOT/patches/nova-bank-api/novapay-partner/src"
API_ROOT="${1:-${NOVA_API_ROOT:-}}"

if [[ -z "${API_ROOT}" ]]; then
  cat <<EOF >&2
ERROR: NestJS API root not provided.

This ecosystem repo does not contain the Nova Bank NestJS application.
Pass the API path:

  NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-novapay-partner.sh
EOF
  exit 2
fi

API_ROOT="$(cd "$API_ROOT" && pwd)"
DEST="$API_ROOT/src/novapay"
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
echo "Copied NovaPay patch → $DEST"

if [[ -n "$APP_MODULE" ]]; then
  if grep -q "NovaPayModule" "$APP_MODULE"; then
    echo "NovaPayModule already referenced in $APP_MODULE"
  else
    python3 - "$APP_MODULE" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
import_line = "import { NovaPayModule } from './novapay/novapay.module';\n"
if "NovaPayModule" in text:
    print("skip import — already present")
    raise SystemExit(0)
lines = text.splitlines(keepends=True)
insert_at = 0
for i, line in enumerate(lines):
    if line.startswith("import "):
        insert_at = i + 1
lines.insert(insert_at, import_line)
text2 = "".join(lines)
needle = "imports: ["
if needle in text2 and "NovaPayModule.register()" not in text2:
    text2 = text2.replace(needle, "imports: [\n    NovaPayModule.register(),", 1)
path.write_text(text2)
print(f"Wired NovaPayModule into {path}")
PY
  fi
else
  echo "WARNING: app.module.ts not found under $API_ROOT — copy succeeded; wire NovaPayModule manually." >&2
fi

cat <<EOF

Install complete (files on disk).

Next (manual — Railway / NestJS host):
  1. In NestJS main.ts prefer: NestFactory.create(AppModule, { rawBody: true })
  2. Set Railway env from $ROOT/.env.example (NOVAPAY_*)
  3. Deploy NestJS API
  4. Smoke-test:
       curl -sS \$NOVA_API/novapay/status | jq .
       curl -sS -H "X-Admin-Key: \$ADMIN_API_KEY" \$NOVA_API/novapay/health | jq .
  5. Ecosystem verify: npm run test:novapay && npm run test:novapay-accounts

See docs/NOVAPAY-NOVA-BANK-WIRING.md
EOF
