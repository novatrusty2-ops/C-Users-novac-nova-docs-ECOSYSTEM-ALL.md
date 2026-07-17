# Nova Bank Ecosystem Manifest

This repository holds the **canonical ecosystem manifest** for the Anakatech LLC Nova fintech stack. It is a configuration snapshot — not the Nova Bank application source.

- **Live Nova Bank:** https://nova-bank-api-production-7311.up.railway.app
- **API base:** https://nova-bank-api-production-7311.up.railway.app/api/v1
- **Nova Swap:** https://nova-bank-api-production-7311.up.railway.app/swap

The manifest was originally generated from the `nova` monorepo (`generatedFrom: "nova"`). Application code, wallet app (`apps/wallet`), and deployment configs live in that separate repository.

## Contents

| Path | Purpose |
|------|---------|
| [`ECOSYSTEM.json`](ECOSYSTEM.json) | Networks, tokens, products, bridges, wallet providers |
| [`docs/ECOSYSTEM-INDEX.md`](docs/ECOSYSTEM-INDEX.md) | Index of mirrored public documentation |
| [`scripts/sync-ecosystem.py`](scripts/sync-ecosystem.py) | Regenerate manifest from live API |
| [`scripts/verify-ecosystem.mjs`](scripts/verify-ecosystem.mjs) | Health-check key endpoints |

## Refreshing the manifest

```bash
# 1. Fetch live API data into tmp/api/
mkdir -p tmp/api
BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1
curl -sS "$BASE/global/status" -o tmp/api/global-status.json
curl -sS "$BASE/wallet/networks" -o tmp/api/wallet-networks.json
curl -sS "$BASE/chains/ecosystem/tokens" -o tmp/api/ecosystem-tokens.json
curl -sS "$BASE/nova-chain/status" -o tmp/api/nova-chain-status.json
curl -sS "$BASE/onex/ecosystem" -o tmp/api/onex-ecosystem.json

# 2. Regenerate ECOSYSTEM.json (applies working-URL policy)
python3 scripts/sync-ecosystem.py

# 3. Validate
python3 -m json.tool ECOSYSTEM.json > /dev/null
node scripts/verify-ecosystem.mjs
```

## URL health and fallbacks

As of July 2026, some domains advertised by the live wallet API are **down** while Railway and VPS endpoints work. The manifest uses **verified working URLs as primary** and documents fallbacks in `ECOSYSTEM.json` → `urlHealth`.

| Service | Primary (working) | Known issue |
|---------|-------------------|-------------|
| Nova Bank API | `nova-bank-api-production-7311.up.railway.app` | — |
| NovaONE RPC | `http://51.75.64.28/novaone-rpc/` | `novablockchainsystem.com` returns 521 |
| NRW World RPC | `nrw-world-chain-production-6029.up.railway.app` | `novablockchainsystem.com/nrw-rpc/` down |
| Nova Swap UI | Railway `/swap` | VPS fallback: `http://51.75.64.28/swap` |
| Bitcoin | Explorer only (`mempool.space`) | `rpcUrls` intentionally empty |

### Undeployed / intentional gaps

- **`deployed.ethereumSourceBridge`** is `null` — Ethereum source bridge not yet deployed.
- **NRW World `explorerUrl`** points at the NRW Central Bank API (status surface); no dedicated block explorer is configured.
- Production API bugs (wallet/networks advertising dead domains, `/chains/status` broken RPCs) require fixes in the **Nova Bank API source repo**, not this manifest.

## Documentation

Public docs are served by the API at `/api/v1/public/docs/:slug` and mirrored under [`docs/`](docs/):

- [`ecosystem`](docs/ecosystem.md) — Ecosystem whitepaper
- [`nova-one`](docs/nova-one.md) — NovaONE chain
- [`nrw-world`](docs/nrw-world.md) — NRW World Chain
- [`kyc`](docs/kyc.md), [`privacy`](docs/privacy.md), [`whitepaper`](docs/whitepaper.md)
- [`dbis-138`](docs/dbis-138.md), [`anakachain`](docs/anakachain.md), [`protocol`](docs/protocol.md)

## Products in the ecosystem

- **Nova Bank Online** — custodial neobank (ledger, cards, fiat/crypto vaults)
- **Nova Swap** — Marionette trading / DEX
- **Nova Wallet** — non-custodial mobile signer (`apps/wallet` in nova monorepo)
- **NovaONE** — QBFT EVM chain (22016)
- **NRW World Chain** — settlement chain (33001)
- **DeFi Oracle (DBIS 138)** — custody chain
- **AnakaChain Bridge** — cross-chain bridge (11013)

## License

Anakatech LLC · ecosystem manifest for internal and integrator use.
