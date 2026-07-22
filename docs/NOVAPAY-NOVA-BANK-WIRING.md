# Nova Bank ↔ NovaPay wiring

End-to-end map for wiring **Nova Bank Online** to the live **NovaPay partner sandbox** on Railway.

## Architecture

```text
Nova Wallet / Portal
        │
        ▼
Nova Bank API (Railway)
  /api/v1/partners/novapay/sandbox/*   ← already live
  /api/v1/novapay/*                    ← NestJS patch (this repo)
  /api/v1/webhooks/novapay             ← NestJS patch
```

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

## NestJS patch install

```bash
NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-novapay-partner.sh
```

Patch source: [`patches/nova-bank-api/novapay-partner/`](../patches/nova-bank-api/novapay-partner/)

## Railway checklist

1. Set env from [`.env.example`](../.env.example) (`NOVAPAY_*`).
2. Install + deploy NestJS patch (requires API checkout).
3. Confirm `GET /api/v1/novapay/status` after deploy.
4. Optional: set `NOVAPAY_WEBHOOK_SECRET` and enable raw body for HMAC.
5. Deploy portal ([`docs/novapay-portal-railway.md`](novapay-portal-railway.md)) and set `ECOSYSTEM.json` → `novaPay.portalUrl`.

## Ecosystem catalog

- `ECOSYSTEM.json` → `novaPay.wiredToNovaBank = true`
- Wallet partner link: [`apps/nova/src/lib/partners.ts`](../apps/nova/src/lib/partners.ts)
- Portal: [`apps/novapay-portal`](../apps/novapay-portal)

## Out of scope (still)

- External NovaPay PSP host / onboarding invite (see [`novapay/AWAITING-PROVIDER.md`](../novapay/AWAITING-PROVIDER.md))
- OpenPayd real-money EMI
- Flipping NestJS `sandboxUiUrl` without API deploy
