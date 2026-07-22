# NovaPay bridge (Railway)

Standalone Node service that exposes NestJS-shaped NovaPay routes and proxies them to the live NovaPay sandbox on Nova Bank API.

## Routes

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Railway healthcheck |
| GET | `/api/v1/novapay/status` | Proxies sandbox `/status` + `bridge: true` |
| GET | `/api/v1/novapay/events` | In-memory bridge events |
| POST | `/api/v1/novapay/receive` | Proxies sandbox `/receive` |
| POST | `/api/v1/novapay/send` | Proxies sandbox `/send` |
| POST | `/api/v1/webhooks/novapay` | Ingest webhook (optional HMAC) |

## Local

```bash
cd apps/novapay-bridge
npm start
# or from repo root:
npm run start:novapay-bridge
```

Smoke:

```bash
curl -s http://127.0.0.1:4080/api/v1/novapay/status | jq .
```

## Railway deploy

1. New service → this repo → root directory `apps/novapay-bridge`
2. Variables:
   - `NOVAPAY_SANDBOX_BASE` = `https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox`
   - `PUBLIC_BASE_URL` = `https://<your-bridge-domain>`
   - optional `NOVAPAY_API_KEY`, `NOVAPAY_WEBHOOK_SECRET`
3. Generate domain → set `PUBLIC_BASE_URL` → paste URL into `ECOSYSTEM.json` → `novaPay.bridgeUrl`

This does **not** patch the NestJS `nova-bank-api` process. For in-process Nest routes, use `scripts/install-novapay-partner.sh` with `NOVA_API_ROOT`.
