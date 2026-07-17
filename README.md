# Nova Bank Ecosystem Manifest

Canonical ecosystem manifest for the Anakatech LLC Nova fintech stack.
This repo is **configuration + docs**, not the Nova Bank application source.

- **Live Nova Bank:** https://nova-bank-api-production-7311.up.railway.app
- **API base:** https://nova-bank-api-production-7311.up.railway.app/api/v1
- **Nova Swap:** https://nova-bank-api-production-7311.up.railway.app/swap
- **Production issues:** [docs/PRODUCTION-ISSUES.md](docs/PRODUCTION-ISSUES.md)

## Contents

| Path | Purpose |
|------|---------|
| [`ECOSYSTEM.json`](ECOSYSTEM.json) | Networks, tokens, products, bridges, health, known issues |
| [`docs/ECOSYSTEM-INDEX.md`](docs/ECOSYSTEM-INDEX.md) | Mirrored public documentation index |
| [`docs/PRODUCTION-ISSUES.md`](docs/PRODUCTION-ISSUES.md) | Live outages that need API/infra repos |
| [`scripts/sync-ecosystem.py`](scripts/sync-ecosystem.py) | Health-probe + regenerate manifest |
| [`scripts/verify-ecosystem.mjs`](scripts/verify-ecosystem.mjs) | CI-friendly endpoint checks |

## Quick verify

```bash
node scripts/verify-ecosystem.mjs
```

Required checks cover Railway bank/swap, NRW chain + central bank, DeFi Oracle, Anaka Bridge, and Alltra. NovaONE VPS / `novablockchainsystem.com` are optional warnings when flaky.

## Refresh the manifest

```bash
mkdir -p tmp/api
BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1
curl -sS "$BASE/global/status" -o tmp/api/global-status.json
curl -sS "$BASE/wallet/networks" -o tmp/api/wallet-networks.json
curl -sS "$BASE/chains/ecosystem/tokens" -o tmp/api/ecosystem-tokens.json
curl -sS "$BASE/onex/ecosystem" -o tmp/api/onex-ecosystem.json
curl -sS "$BASE/production-node/status" -o tmp/api/production-node-status.json

python3 scripts/sync-ecosystem.py
python3 -m json.tool ECOSYSTEM.json > /dev/null
node scripts/verify-ecosystem.mjs
```

`sync-ecosystem.py` probes RPC candidates and orders NovaONE URLs by live health. It does **not** blindly copy dead hostnames from `/wallet/networks`.

## URL policy

| Service | Primary | Notes |
|---------|---------|-------|
| Nova Bank API | Railway | Working |
| Nova Swap UI | Railway `/swap` | VPS fallback may be down |
| NRW World RPC | Railway NRW chain | Working |
| NRW Central Bank | Railway | Working |
| NovaONE RPC | Health-probed candidates | Often degraded — see `urlHealth` |
| Nova Production Node | `/api/v1/production-node/rpc` | Currently disconnected |
| Bitcoin | Explorer only | `rpcUrls` empty by design |

See `ECOSYSTEM.json` → `urlHealth` and `knownIssues` for the latest probe results.

## Intentional gaps

- **`deployed.ethereumSourceBridge`** is `null` (undeployed).
- **NRW explorer** points at the central bank API status surface.
- **API source bugs** (dead domain ads, production-node networking, `/wallet-ecosystem` 404) are tracked in [docs/PRODUCTION-ISSUES.md](docs/PRODUCTION-ISSUES.md).

## Documentation

Mirrored from `/api/v1/public/docs/:slug`:

- [Ecosystem](docs/ecosystem.md) · [NovaONE](docs/nova-one.md) · [NRW World](docs/nrw-world.md)
- [KYC](docs/kyc.md) · [Privacy](docs/privacy.md) · [Whitepaper](docs/whitepaper.md)
- [DBIS 138](docs/dbis-138.md) · [AnakaChain](docs/anakachain.md) · [Protocol](docs/protocol.md)

## Products

- **Nova Bank Online** — custodial neobank (ledger, cards, vaults)
- **Nova Swap** — Marionette DEX
- **Nova Wallet** — non-custodial signer (`apps/wallet` in nova monorepo)
- **NovaONE** (22016) · **NRW World** (33001) · **DBIS 138** · **AnakaChain Bridge** (11013)

## License

Anakatech LLC · ecosystem manifest for internal and integrator use.
