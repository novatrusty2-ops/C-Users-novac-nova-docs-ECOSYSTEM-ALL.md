# PouchPay Nest patch install + Railway redeploy

## Live (2026-07-26)

| Surface | Status |
|---------|--------|
| Bridge | **https://pouchpay-bridge-production.up.railway.app** — HTTP 200 + `callData` |
| Nova Bank `…/alltra-chain/markets/quote` | Proxies bridge (`source: pouchpay-bridge`, non-empty `path` + `callData`) |
| `api.pouchpay.io` | Still virtual-LP / empty `path` (separate Apache host — not Railway) |

Bank env wired:

```
POUCHPAY_API_URL=https://pouchpay-bridge-production.up.railway.app
POUCHPAY_QUOTE_API=https://pouchpay-bridge-production.up.railway.app/v0/quote
POUCHPAY_BRIDGE_URL=https://pouchpay-bridge-production.up.railway.app
POUCHPAY_ROUTES_API=https://pouchpay-bridge-production.up.railway.app/v1/advanced/routes
```

## Path A — Redeploy bridge

```bash
export RAILWAY_API_TOKEN=...   # account token
cd apps/pouchpay-bridge
npx @railway/cli link -p nova-bank-online -e production -s pouchpay-bridge
npx @railway/cli up --detach --service pouchpay-bridge
```

Smoke:

```bash
POUCHPAY_API_BASE=https://pouchpay-bridge-production.up.railway.app npm run verify:pouchpay-routes
```

## Path B — Install Nest patch into Bank API + redeploy

```bash
# if you have a local/private bank checkout:
bash scripts/install-and-wire-pouchpay-calldata.sh /path/to/nova-bank-api

# or clone then install:
NOVA_BANK_API_GIT_URL=https://github.com/ORG/nova-bank-api.git \
  bash scripts/install-and-wire-pouchpay-calldata.sh

cd /path/to/nova-bank-api
git add src/pouchpay-calldata src/app.module.ts
git commit -m "feat: embed PouchPay UniswapV2 callData quotes"
git push
# Railway auto-redeploy if the service tracks that repo
```

Bank env (optional bridge):

```
ALLTRA_RPC=https://mainnet-rpc.alltra.global
```

## Reply in chat with either

- `RAILWAY_TOKEN=...` (and optional service name), or  
- `NOVA_BANK_API_GIT_URL=...` (+ deploy rights),

and the agent can finish the deploy/verify loop.
