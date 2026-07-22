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
| `NOVAPAY_SANDBOX_BASE` | **Already baked in** `railway.toml` + Dockerfile. Confirm in Railway → Variables: `https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox` |
| `PUBLIC_BASE_URL` | `https://<generated-domain>` (set after domain) |
| `NOVAPAY_API_KEY` | optional bearer |
| `NOVAPAY_WEBHOOK_SECRET` | optional HMAC |

**Step 2 copy-paste (Railway → Variables → New):**

```text
NOVAPAY_SANDBOX_BASE
https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox
```

## Step 3 — Generate domain + catalog

This environment cannot click Railway **Generate Domain**. Do it in the UI, then stamp the URL here.

1. Railway → bridge service → **Settings** → **Networking** → **Generate Domain**
2. Copy the HTTPS URL (e.g. `https://novapay-bridge-production-xxxx.up.railway.app`)
3. `PUBLIC_BASE_URL` is optional: the bridge auto-uses `RAILWAY_PUBLIC_DOMAIN` after the domain exists. You can still set:

```text
PUBLIC_BASE_URL
https://novapay-bridge-production-xxxx.up.railway.app
```

4. Stamp catalog (paste your real domain):

```bash
npm run set:novapay-bridge-url -- https://novapay-bridge-production-xxxx.up.railway.app
```

5. Smoke:

```bash
curl -s https://<bridge>/api/v1/novapay/status | jq .
# expect bridge: true
```

6. Reply in chat with the domain if you want the agent to run the stamp + commit for you.

## Local

```bash
npm run test:novapay-bridge
npm run start:novapay-bridge
```
