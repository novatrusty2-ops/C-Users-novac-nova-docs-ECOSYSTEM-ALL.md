# Nova Bank Ecosystem Manifest

Canonical ecosystem manifest for the Anakatech LLC Nova fintech stack. This is **not** the Nova Bank NestJS application source (`nova` monorepo).

- **Live Nova Bank:** https://nova-bank-api-production-7311.up.railway.app
- **API base:** https://nova-bank-api-production-7311.up.railway.app/api/v1
- **Nova Swap:** https://nova-bank-api-production-7311.up.railway.app/swap
- **Legal entity (API):** Nova Bank Malta Ltd · EMI partner OpenPayd · VFA signal on live API

## Contents

| Path | Purpose |
|------|---------|
| [`ECOSYSTEM.json`](ECOSYSTEM.json) | Networks, tokens, products, bridges, TyganPay status |
| [`docs/ECOSYSTEM-INDEX.md`](docs/ECOSYSTEM-INDEX.md) | Index of mirrored public documentation |
| [`docs/tyganpay-onboarding.md`](docs/tyganpay-onboarding.md) | TyganPay client onboarding guide |
| [`tyganpay/`](tyganpay/) | Form payload + declaration drafts for TyganPay |
| [`scripts/sync-ecosystem.py`](scripts/sync-ecosystem.py) | Regenerate manifest from live API |
| [`scripts/verify-ecosystem.mjs`](scripts/verify-ecosystem.mjs) | Health-check key endpoints |
| [`scripts/check-tyganpay-invite.py`](scripts/check-tyganpay-invite.py) | Probe TyganPay invite status |
| [`patches/nova-bank-api/wallet-integrity`](patches/nova-bank-api/wallet-integrity) | NestJS drop-in for “Wallet not found” |

## TyganPay onboarding (current blocker)

Invite token `nova-660c3e14…` returns **423** `onboarding_link_view_limit_blocked`. Ask TyganPay admin/Sylvain to reset the link (template: [`tyganpay/RESET-REQUEST.md`](tyganpay/RESET-REQUEST.md)), then submit using:

```bash
python3 scripts/check-tyganpay-invite.py
# After reset: paste fields from tyganpay/form-payload.json
```

Job checklist: [`docs/JOB-COMPLETE.md`](docs/JOB-COMPLETE.md) · Guide: [`docs/tyganpay-onboarding.md`](docs/tyganpay-onboarding.md).

## Anaka Connect VPS / wallet integrity

Ops scripts (need your credentials / nova checkout):

```bash
bash scripts/restart-anaka-connect.sh          # step 3 — VPS
export NOVA_API_ROOT=/path/to/nova/apps/api
bash scripts/apply-wallet-integrity-patch.sh  # step 4 — NestJS patch
```


`51.75.64.28` is **Anaka Connect** (`ANAKA_CONNECT_BASE` / `novaBankVPS`). TCP accepts; HTTP may reset when the app stack is down.

| Artifact | Path |
|----------|------|
| Anaka Connect / VPS runbook | [`docs/anaka-connect-vps.md`](docs/anaka-connect-vps.md) |
| Railway transfer diagnosis | [`docs/wallet-integrity-diagnosis.md`](docs/wallet-integrity-diagnosis.md) |
| NestJS patch | [`patches/nova-bank-api/wallet-integrity`](patches/nova-bank-api/wallet-integrity) |
| Client workaround | [`scripts/transfer-by-account-resolve.py`](scripts/transfer-by-account-resolve.py) |

```bash
cd patches/nova-bank-api/wallet-integrity && npm test
```

## Health checks (all HTTP 200)

```bash
node scripts/verify-ecosystem.mjs
# Expect: All 12 required checks HTTP 200
# Outages (VPS/NovaONE/Alchemy) are informational only — see ECOSYSTEM.json → urlHealth.outages
```

## Refreshing the manifest

```bash
mkdir -p tmp/api
BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1
curl -sS "$BASE/global/status" -o tmp/api/global-status.json
curl -sS "$BASE/wallet/networks" -o tmp/api/wallet-networks.json
curl -sS "$BASE/chains/ecosystem/tokens" -o tmp/api/ecosystem-tokens.json
curl -sS "$BASE/nova-chain/status" -o tmp/api/nova-chain-status.json
curl -sS "$BASE/onex/ecosystem" -o tmp/api/onex-ecosystem.json

python3 scripts/sync-ecosystem.py
python3 -m json.tool ECOSYSTEM.json > /dev/null
node scripts/verify-ecosystem.mjs
```

`scripts/sync-ecosystem.py` preserves the `tyganPay` block when regenerating.

## URL health and fallbacks

| Service | Primary (working) | Known issue |
|---------|-------------------|-------------|
| Nova Bank API | `nova-bank-api-production-7311.up.railway.app` | — |
| NovaONE RPC | `http://51.75.64.28/novaone-rpc/` | `novablockchainsystem.com` returns 521 |
| NRW World RPC | `nrw-world-chain-production-6029.up.railway.app` | `novablockchainsystem.com/nrw-rpc/` down |
| Nova Swap UI | Railway `/swap` | VPS fallback: `http://51.75.64.28/swap` |

## Documentation

Mirrored under [`docs/`](docs/): ecosystem, nova-one, nrw-world, kyc, privacy, whitepaper, dbis-138, anakachain, protocol, TyganPay onboarding, wallet integrity.

## License

Anakatech LLC · ecosystem manifest for internal and integrator use.
