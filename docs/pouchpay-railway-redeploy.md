# PouchPay Nest patch install + Railway redeploy

## Blockers in Cloud Agent

This environment has:

- Nest patch source in `patches/nova-bank-api/pouchpay-calldata`
- Ready bridge in `apps/pouchpay-bridge`
- **No** `RAILWAY_TOKEN` / Railway login
- **No** `nova-bank-api` git checkout in the org (`novatrusty2-ops` only has this ecosystem repo)

So live `nova-bank-api-production-7311.up.railway.app` and `api.pouchpay.io` cannot be mutated until you provide a token (or clone URL).

## Path A — Deploy bridge (recommended, no Nest checkout)

1. Railway → open the Nova Bank project → **Settings → Tokens → Create** project token  
2. In this environment (or GitHub Actions secret `RAILWAY_TOKEN`):

```bash
export RAILWAY_TOKEN=...
export RAILWAY_SERVICE=pouchpay-bridge   # create empty service first if needed
bash scripts/deploy-pouchpay-railway.sh
```

3. Railway → service → **Networking → Generate Domain**  
4. Smoke:

```bash
curl -sS https://<domain>/v0/quote -H 'content-type: application/json' \
  -d '{"fromSymbol":"ALL","toSymbol":"AUSDT","amount":"0.01","recipient":"0x5227115Ba7c8694218f570c1EC2a680095872820"}'
# expect path[] length >= 2 and callData 0x…
```

5. Point wallet `quoteApi` / `VITE_POUCHPAY_API_BASE` at that domain (or set Bank `POUCHPAY_BRIDGE_URL`).

GitHub Actions: add secret `RAILWAY_TOKEN`, then run workflow **Deploy PouchPay bridge (Railway)**.

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
