#!/usr/bin/env bash
# Copy the NestJS wallet-integrity drop-in into a local nova API checkout.
# Does not deploy to Railway — commit + ship from the nova monorepo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH_SRC="$ROOT/patches/nova-bank-api/wallet-integrity"
NOVA_API_ROOT="${NOVA_API_ROOT:-}"

if [[ -z "$NOVA_API_ROOT" ]]; then
  cat <<EOF
NOVA_API_ROOT is not set.

This docs repo does not contain the private NestJS nova API source.
Clone/checkout that monorepo, then:

  export NOVA_API_ROOT=/path/to/nova/apps/api   # NestJS app root with src/
  bash scripts/apply-wallet-integrity-patch.sh

Then wire WalletIntegrityModule in app.module.ts (printed below),
implement WalletIntegrityStore against real DB repos, commit, and deploy
to Railway (nova-bank-api-production-7311).
EOF
  exit 2
fi

if [[ ! -d "$NOVA_API_ROOT/src" ]]; then
  echo "ERROR: $NOVA_API_ROOT/src not found (point NOVA_API_ROOT at NestJS app root)" >&2
  exit 2
fi

DEST="$NOVA_API_ROOT/src/wallet-integrity"
mkdir -p "$DEST"
rsync -a --exclude test --exclude node_modules --exclude package.json \
  "$PATCH_SRC/src/" "$DEST/"

# Keep tests next to patch for reference
mkdir -p "$NOVA_API_ROOT/test/wallet-integrity"
cp -f "$PATCH_SRC/test/wallet-integrity.test.mjs" "$NOVA_API_ROOT/test/wallet-integrity/" 2>/dev/null || true
cp -f "$PATCH_SRC/README.md" "$DEST/README.md"

echo "Copied patch → $DEST"
echo
cat <<'EOF'
Wire-up checklist:

1) app.module.ts
   import { WalletIntegrityModule } from './wallet-integrity/wallet-integrity.module';
   // add WalletIntegrityModule to @Module({ imports: [...] })

2) Implement WalletIntegrityStore (TypeORM/Prisma) — see store.interface.ts
   Replace InMemoryWalletIntegrityStore in production module providers.

3) TransfersService.transferByAccount — before debit:
   const wallet = await this.walletIntegrity.ensureSourceWallet(dto.fromAccountId, req.user.id);
   // use wallet.id as fromAccountId

4) GET /accounts/:accountNumber mapper — add hasWallet

5) Deploy Railway API, then verify:
   export BASE=https://nova-bank-api-production-7311.up.railway.app
   export TOKEN=... ADMIN_KEY=...
   curl -sS -X POST "$BASE/api/v1/admin/wallets/repair" -H "X-Admin-Key: $ADMIN_KEY"
   curl -sS "$BASE/api/v1/admin/wallets/health" -H "X-Admin-Key: $ADMIN_KEY"
   # OpenAPI still marks fromAccountId as uuid until patch ships; after deploy,
   # 4-digit fromAccountId should stop returning Wallet not found.

Client workaround until deploy:
   python3 scripts/transfer-by-account-resolve.py --from 9873 --to 7318 --amount 1 --pin ....
EOF

CODE=$(curl -sS -o /tmp/wi-health -w "%{http_code}" -m 15 \
  "https://nova-bank-api-production-7311.up.railway.app/api/v1/admin/wallets/health" || echo ERR)
echo
echo "Live admin/wallets/health → HTTP $CODE (404 means patch not deployed yet)"
