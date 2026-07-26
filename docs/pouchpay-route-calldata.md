# PouchPay route swap — missing callData

## Symptom

PouchPay wallet `global_swap` skill hits:

| Endpoint | Issue |
|----------|--------|
| `POST https://api.pouchpay.io/v0/quote` | `path: []`, no `callData`, `legacyOnChainSwapRemoved: true` |
| `POST https://api.pouchpay.io/v1/advanced/routes` | Ignores `toSymbol` (ALL→ALL), steps lack `transactionRequest` / `callData` |
| `POST …/api/v1/alltra-chain/markets/quote` | Same virtual-LP quote (`source: "pouchpay"`, often HTTP 201) |

Without call data the mobile wallet cannot build a signable Alltra (651940) swap tx.

## Root cause

On-chain swap encoding was removed in favor of virtual LP + `executeVia: "nova"`. The Uniswap V2 router at `0xEd04ee8307C0656207af5afe3926Ae2380052940` still has live liquidity (`getAmountsOut` for WALL→AUSDT succeeds).

## Fix in this repo (PouchPay **31.195** / versionCode **31195**)

1. **`apps/nova` Trade tab** — light high-contrast token picker + client-side UniswapV2 `callData` builder for Alltra (651940). Works without upstream callData.
2. **`apps/pouchpay-bridge`** — Railway-ready service that returns `path` + `callData` + `transactionRequest` + HTTP 200.
3. **`apps/nova/src/lib/pouchpay`** — wallet client; prefers on-chain builder, rejects HTTP quotes missing call data.
4. **`patches/nova-bank-api/pouchpay-calldata`** — Nest module with **embedded** callData builder (no `POUCHPAY_BRIDGE_URL` required). Overrides:
   - `POST …/alltra-chain/markets/quote` → HTTP 200 + callData
   - `POST /v0/quote` + `POST /v1/advanced/routes` (wallet-shaped; see patch README for prefix notes)

```bash
PORT=4082 npm run start -w pouchpay-bridge
POUCHPAY_API_BASE=http://127.0.0.1:4082 npm run verify:pouchpay-routes

# Install Nest patch into a Bank / wallet checkout (embedded builder):
bash scripts/install-pouchpay-calldata.sh /path/to/nova-bank-api
```

### Production rollout

See **[pouchpay-railway-redeploy.md](./pouchpay-railway-redeploy.md)** for Nest install + Railway steps.

| Surface | Action |
|---------|--------|
| Nova Wallet (Pages) | Already builds callData client-side |
| Nova Bank Railway | `bash scripts/install-and-wire-pouchpay-calldata.sh /path/to/nova-bank-api` then redeploy |
| Bridge (no Nest checkout) | `RAILWAY_TOKEN=… bash scripts/deploy-pouchpay-railway.sh` |
| `api.pouchpay.io` | Install Nest module on wallet host **or** point `quoteApi` at deployed bridge |

**Live bridge:** https://pouchpay-bridge-production.up.railway.app  
Bank markets quote now returns `source: "pouchpay-bridge"` with `path` + `callData`.  
`api.pouchpay.io` is still on a separate host with empty `path[]` — point mobile `quoteApi` at the bridge (or update that host).
