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
   - `NOVAPAY_SANDBOX_BASE` (baked into `railway.toml` / Dockerfile)
   - optional `PUBLIC_BASE_URL` (else uses `RAILWAY_PUBLIC_DOMAIN` after Generate Domain)
   - optional `NOVAPAY_API_KEY`, `NOVAPAY_WEBHOOK_SECRET`
3. **Generate Domain** → stamp catalog:

```bash
npm run set:novapay-bridge-url -- https://<your-bridge-domain>
```

See [`docs/novapay-bridge-railway.md`](../../docs/novapay-bridge-railway.md).

This does **not** patch the NestJS `nova-bank-api` process. For in-process Nest routes, use `scripts/install-novapay-partner.sh` with `NOVA_API_ROOT`.
