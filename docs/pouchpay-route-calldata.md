# PouchPay route swap — missing callData

## Symptom

PouchPay wallet `global_swap` skill hits:

| Endpoint | Issue |
|----------|--------|
| `POST https://api.pouchpay.io/v0/quote` | `path: []`, no `callData`, `legacyOnChainSwapRemoved: true` |
| `POST https://api.pouchpay.io/v1/advanced/routes` | Ignores `toSymbol` (ALL→ALL), steps lack `transactionRequest` / `callData` |
| `POST …/api/v1/alltra-chain/markets/quote` | Same virtual-LP quote proxied from PouchPay (`source: "pouchpay"`) |

Without call data the mobile wallet cannot build a signable Alltra (651940) swap tx.

## Root cause

On-chain swap encoding was removed in favor of virtual LP + `executeVia: "nova"`. The Uniswap V2 router at `0xEd04ee8307C0656207af5afe3926Ae2380052940` still has live liquidity (`getAmountsOut` for WALL→AUSDT succeeds).

## Fix in this repo

1. **`apps/pouchpay-bridge`** — Railway-ready service that returns `path` + `callData` + `transactionRequest` using the live router.
2. **`apps/nova/src/lib/pouchpay`** — wallet client that rejects quotes missing call data.
3. **`patches/nova-bank-api/pouchpay-calldata`** — Nest override that proxies Bank `/alltra-chain/markets/quote` to the bridge.

```bash
PORT=4082 npm run start -w pouchpay-bridge
POUCHPAY_API_BASE=http://127.0.0.1:4082 npm run verify:pouchpay-routes
```

Point PouchPay / Nova at the bridge (`VITE_POUCHPAY_API_BASE` or `POUCHPAY_BRIDGE_URL`) until upstream `api.pouchpay.io` ships call data again.
