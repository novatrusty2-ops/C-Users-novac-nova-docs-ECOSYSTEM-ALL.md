# OpenPayd EMI patch — Nova Bank Malta Ltd

Drop-in NestJS module for the private Nova Bank API (Railway service `nova-bank-api-production-7311`) that wires **OpenPayd** as the EMI partner for **Nova Bank Malta Ltd**.

Live Nova Bank API already discloses:

- `GET /api/v1/global/status` → `features.malta.emiPartner = "openpayd"`
- `GET /api/v1/international/integrations` → `id=openpayd`, `configHint=EMI_OPENPAYD_API_KEY`

This patch provides the NestJS client + admin/status/webhook routes. **Secrets are not included** — set them on Railway from the root [`.env.example`](../../../.env.example).

## What you get

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/v1/openpayd/status` | public | Config readiness (redacted; no secrets) |
| `GET /api/v1/openpayd/health` | `X-Admin-Key` | OAuth + list accounts probe |
| `GET /api/v1/openpayd/accounts` | `X-Admin-Key` | List OpenPayd payment accounts |
| `GET /api/v1/openpayd/accounts/default` | `X-Admin-Key` | Fetch `OPENPAYD_ACCOUNT_ID` |
| `POST /api/v1/webhooks/openpayd` | signature | OpenPayd event ingress |
| `POST /api/v1/webhooks/:provider` | signature | Alias when `provider=openpayd` |

Client capabilities:

1. OAuth2 `client_credentials` (`Basic username:password` → Bearer token)
2. `x-account-holder-id` on API calls
3. Account list / get / payout helper with `x-idempotency-key`
4. Webhook HMAC verification (`OPENPAYD_WEBHOOK_SECRET`)
5. Optional ledger hook for crediting Nova accounts after verified events

## Install into Nova Bank NestJS API

```bash
# From nova monorepo root (NestJS API app)
mkdir -p apps/api/src/openpayd
cp -R path/to/ecosystem/patches/nova-bank-api/openpayd-emi/src/* apps/api/src/openpayd/
```

Wire the module:

```ts
// app.module.ts
import { OpenPaydModule } from './openpayd/openpayd.module';

@Module({
  imports: [
    // ...existing
    OpenPaydModule.register({
      // Optional: credit Nova ledger on verified pay-ins
      // ledger: { onVerifiedEvent: async (e) => { ... } },
    }),
  ],
})
export class AppModule {}
```

Enable raw body for webhook signature verification (NestJS):

```ts
// main.ts — required for HMAC over exact bytes
const app = await NestFactory.create(AppModule, { rawBody: true });
```

If your host already implements `POST /webhooks/:provider`, either:

- remove the duplicate `@Post('webhooks/:provider')` from `openpayd.controller.ts`, or
- delegate `provider === 'openpayd'` into `OpenPaydService.handleWebhook`.

## Railway environment variables

Copy from [`.env.example`](../../../.env.example). Minimum to connect:

```bash
EMI_OPENPAYD_API_KEY=          # Nova catalog hint; also used as password fallback
OPENPAYD_USERNAME=
OPENPAYD_PASSWORD=
OPENPAYD_ACCOUNT_HOLDER_ID=
OPENPAYD_BASE_URL=https://sandbox.openpayd.com
OPENPAYD_ENV=sandbox
OPENPAYD_ACCOUNT_ID=           # EUR settlement account
OPENPAYD_WEBHOOK_SECRET=
OPENPAYD_WEBHOOK_URL=https://nova-bank-api-production-7311.up.railway.app/api/v1/webhooks/openpayd
OPENPAYD_LEGAL_ENTITY=Nova Bank Malta Ltd
OPENPAYD_SETTLEMENT_CURRENCY=EUR
OPENPAYD_SETTLEMENT_IBAN=      # from OpenPayd portal / compliance — not git
OPENPAYD_SETTLEMENT_BIC=
```

`EMI_OPENPAYD_API_KEY` is the live catalog `configHint`. If `OPENPAYD_PASSWORD` is empty, the client uses `EMI_OPENPAYD_API_KEY` as the OAuth password.

## Sandbox smoke test (after secrets are set on Railway)

```bash
# Public readiness
curl -sS "$NOVA_API/openpayd/status" | jq .

# Admin health (OAuth + accounts)
curl -sS -H "X-Admin-Key: $ADMIN_API_KEY" "$NOVA_API/openpayd/health" | jq .

# Accounts
curl -sS -H "X-Admin-Key: $ADMIN_API_KEY" "$NOVA_API/openpayd/accounts?currency=EUR" | jq .
```

Local unit tests (no NestJS peer install required for client/webhook):

```bash
cd patches/nova-bank-api/openpayd-emi
npm test
```

## Production cutover

1. Sandbox OAuth + accounts OK via `/openpayd/health`
2. Register webhook URL in OpenPayd portal → receive signed event on `/webhooks/openpayd`
3. Implement `OpenPaydLedgerHook.onVerifiedEvent` against Nova ledger
4. Set production `OPENPAYD_BASE_URL` / `OPENPAYD_ENV=production` / `OPENPAYD_LIVE=true`
5. Confirm public `GET /global/status` banking flags leave sandbox when NestJS cutover is intentional
6. Store settlement IBAN outside git; keep bank ownership proof with compliance

## Related docs in this ecosystem repo

- [`docs/OPENPAYD-NOVA-BANK-MALTA-SETUP.md`](../../../docs/OPENPAYD-NOVA-BANK-MALTA-SETUP.md)
- [`docs/OPENPAYD-MALTA-EMI-HANDOFF.md`](../../../docs/OPENPAYD-MALTA-EMI-HANDOFF.md)
- [`.env.example`](../../../.env.example)
