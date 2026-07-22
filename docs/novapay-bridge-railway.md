# NovaPay bridge on Railway

Deploy NestJS-shaped `/api/v1/novapay/*` and `/api/v1/webhooks/novapay` without patching the NestJS API checkout.

App: [`apps/novapay-bridge`](../apps/novapay-bridge)

## Why

Live sandbox is already on Nova Bank API (`/api/v1/partners/novapay/sandbox/*`). The bridge exposes the partner-facing Nest routes and proxies to that sandbox.

## Deploy

1. Railway → New Service → same GitHub repo
2. Root directory: `apps/novapay-bridge`
3. Variables:

| Variable | Value |
|----------|--------|
| `NOVAPAY_SANDBOX_BASE` | `https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox` |
| `PUBLIC_BASE_URL` | `https://<generated-domain>` (set after domain) |
| `NOVAPAY_API_KEY` | optional bearer |
| `NOVAPAY_WEBHOOK_SECRET` | optional HMAC |

4. Generate domain → set `PUBLIC_BASE_URL`
5. Smoke:

```bash
curl -s https://<bridge>/api/v1/novapay/status | jq .
# expect bridge: true
```

6. Catalog: set `ECOSYSTEM.json` → `novaPay.bridgeUrl` (and `products.novaPay.bridgeUrl`)

## Local

```bash
npm run test:novapay-bridge
npm run start:novapay-bridge
```
