# Nova Bank Production Issues

Issues discovered while syncing this ecosystem manifest against live production
(`https://nova-bank-api-production-7311.up.railway.app`).

This repository is **manifest-only**. Items marked **API source** cannot be fixed here —
they require the Nova Bank application / infrastructure repositories.

Last probed: see `ECOSYSTEM.json` → `urlHealth.checkedAt`.

## Critical / High

### 1. NovaONE public RPC outage (critical when no candidate responds)

| Field | Value |
|-------|-------|
| Symptom | `eth_blockNumber` fails on VPS, `novablockchainsystem.com`, `anakatech.llc`, and `novablockchain.it.com` candidates |
| Impact | Wallets, swap settlement, and bridge adapters cannot reach chain 22016 |
| Fix in | VPS `51.75.64.28`, Cloudflare origins, Besu QBFT mesh |

**Required ops actions**

1. Restore Besu node JSON-RPC on the VPS (`/novaone-rpc/`).
2. Point Cloudflare origins for `novablockchainsystem.com` / `novablockchain.it.com` at a live upstream.
3. Update Nova Bank API `wallet/networks` and `chains/status` to advertise working URLs only.

### 2. `novablockchainsystem.com` down / unreliable (high)

| Field | Value |
|-------|-------|
| Symptom | Cloudflare 521, timeouts, or 403 |
| Impact | Live `/api/v1/wallet/networks` still lists this host for NovaONE, NRW, Nova Bank ledger, Alltra, and production node |
| Fix in | Cloudflare + origin host + Nova Bank API config |

**API source fix**

- Replace hardcoded NBS hostnames with Railway / verified VPS URLs (same policy as this manifest).
- Add health-aware RPC selection in the wallet networks serializer.

### 3. Nova Production Node disconnected (high)

From `/api/v1/production-node/status`:

- `edge.connected: false` — `http://host.docker.internal/rpc` fetch failed
- `upstream.connected: false` — `http://127.0.0.1:28545/rpc` fetch failed
- Public `https://…railway.app/rpc` → **404**
- Proxy `/api/v1/production-node/rpc` → **500**

**API / deploy fix**

1. Wire Railway service networking to the real upstream RPC (not `host.docker.internal` unless that host exists).
2. Expose `/rpc` again or remove it from public docs.
3. Keep `production-node/status` accurate for integrators.

### 4. `/api/v1/chains/status` hangs or reports false negatives (medium/high)

| Field | Value |
|-------|-------|
| Symptom | Frequent timeouts; when it responds, NovaONE uses broken `anakatech.llc` RPC and NRW uses internal `http://nrw-world:8560/` |
| Fix in | Nova Bank API source |

Use Railway NRW RPC and health-probed NovaONE RPC instead of Docker-internal hostnames for public status.

## Medium

### 5. `/api/v1/wallet-ecosystem` 404

Public docs and `onex/ecosystem` advertise:

```
GET /api/v1/wallet-ecosystem
```

Production returns **404**. Working replacements:

- `GET /api/v1/wallet/networks`
- `GET /api/v1/chains/ecosystem/tokens`
- `GET /api/v1/wallet/portfolio/:address`

### 6. NovaONE / swap status endpoints timeout

`/api/v1/nova-chain/status`, `/api/v1/nova-chain/connection-info`, and `/api/v1/swap/status` often time out when upstream RPC is down. They should fail fast with cached last-known-good connection info.

## Low / intentional

| Item | Status |
|------|--------|
| `deployed.ethereumSourceBridge: null` | Undeployed — do not invent an address |
| Bitcoin `rpcUrls: []` | Intentional explorer-only (`mempool.space`) |
| NRW `explorerUrl` → central bank API | No dedicated block explorer configured |

## What this repo already fixed

- Manifest primary URLs prefer Railway + health-probed candidates
- Dead NBS URLs demoted to last-resort fallbacks
- Token catalog merged; USDT/USDC include `nova-bank` / `alltra-mainnet`
- `nova-production` and `alltra-mainnet` present in wallet networks + chains
- Broken `/wallet-ecosystem` path documented; integrations point at working routes
- `scripts/verify-ecosystem.mjs` checks primaries and reports degraded chain RPCs
- `knownIssues` array in `ECOSYSTEM.json` tracks open production defects

## Access needed to finish the rest

Provide the **Nova Bank API / `nova` monorepo** (and preferably VPS/Cloudflare access) to:

1. Stop advertising dead domains from `/wallet/networks`
2. Fix production-node networking
3. Restore NovaONE RPC
4. Repair `/chains/status` and `/wallet-ecosystem`
