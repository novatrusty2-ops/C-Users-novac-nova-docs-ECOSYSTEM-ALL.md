# Nova Bank ↔ NovaPay wiring

End-to-end map for wiring **Nova Bank Online** to the live **NovaPay partner sandbox** on Railway.

## Architecture

```text
Nova Wallet / Portal
        │
        ├──────────────────────────────┐
        ▼                              ▼
Nova Bank API (Railway)         novapay-bridge (Railway)
  /partners/novapay/sandbox/*     /api/v1/novapay/*
  (already live)                  /api/v1/webhooks/novapay
        ▲                              │
        └──────── proxy ───────────────┘
```

**Preferred without NestJS API checkout:** deploy [`apps/novapay-bridge`](../apps/novapay-bridge) — NestJS-shaped routes that proxy the live sandbox.

**Optional in-process:** install [`patches/nova-bank-api/novapay-partner/`](../patches/nova-bank-api/novapay-partner/) into `NOVA_API_ROOT` and redeploy `nova-bank-api`.

Default: same-host sandbox (not an external `api.novapay.com`). TyganPay-style external host remains future work.

## Live sandbox (already working)

| Endpoint | URL |
|----------|-----|
| Status | https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status |
| Partners | https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/status |

```bash
npm run test:novapay
npm run test:novapay-accounts
```

## Three business accounts

See [`novapay/SETTLEMENT-ACCOUNT.md`](../novapay/SETTLEMENT-ACCOUNT.md).

1. EUR Revolut — TOTAL DESIGN S.R.L. — `LT163250079884101461` / `REVOLT21`
2. EUR Wise — GLOBAL LUXURY SRLS — `BE18905804591765` / `TRWIBEB1XXX`
3. USD Wise — GLOBAL LUXURY SRLS — routing `084009519` / acct `515842398651352` / `TRWIUS35XXX`

## Deploy NovaPay bridge (no NestJS checkout)

```bash
npm run test:novapay-bridge   # local integration vs live sandbox
npm run start:novapay-bridge  # http://127.0.0.1:4080
```

Railway: new service → root directory `apps/novapay-bridge` → set `NOVAPAY_SANDBOX_BASE` + `PUBLIC_BASE_URL` → generate domain → set `ECOSYSTEM.json` → `novaPay.bridgeUrl`.

See [`docs/novapay-bridge-railway.md`](novapay-bridge-railway.md) and [`apps/novapay-bridge/README.md`](../apps/novapay-bridge/README.md).

## NestJS patch install (optional)

```bash
NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-novapay-partner.sh
```

Patch source: [`patches/nova-bank-api/novapay-partner/`](../patches/nova-bank-api/novapay-partner/)

## Railway checklist

1. **Bridge (recommended):** deploy `apps/novapay-bridge` with env from [`apps/novapay-bridge/.env.example`](../apps/novapay-bridge/.env.example).
2. Confirm `GET https://<bridge>/api/v1/novapay/status` returns `bridge: true`.
3. Optional NestJS path: set env from [`.env.example`](../.env.example), install patch, redeploy `nova-bank-api`.
4. Optional: set `NOVAPAY_WEBHOOK_SECRET` on the bridge.
5. Deploy portal ([`docs/novapay-portal-railway.md`](novapay-portal-railway.md)) and set `ECOSYSTEM.json` → `novaPay.portalUrl` / `bridgeUrl`.

## Ecosystem catalog

- `ECOSYSTEM.json` → `novaPay.wiredToNovaBank = true`
- Wallet partner link: [`apps/nova/src/lib/partners.ts`](../apps/nova/src/lib/partners.ts)
- Portal: [`apps/novapay-portal`](../apps/novapay-portal)
- Bridge: [`apps/novapay-bridge`](../apps/novapay-bridge)

## Out of scope (still)

- External NovaPay PSP host / onboarding invite (see [`novapay/AWAITING-PROVIDER.md`](../novapay/AWAITING-PROVIDER.md))
- OpenPayd real-money EMI
- Flipping NestJS `sandboxUiUrl` without API deploy
