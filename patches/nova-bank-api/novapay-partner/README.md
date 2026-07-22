# NovaPay partner patch — Nova Bank Online

Drop-in NestJS module that wires **NovaPay** partner sandbox routes into the private Nova Bank API (Railway `nova-bank-api-production-7311`).

Live partner status already shows:

```bash
curl -sS https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status
```

This patch adds NestJS admin/status/webhook routes that call those sandbox APIs. **Secrets are not included** — set them on Railway from the root [`.env.example`](../../../.env.example).

## Routes (under `/api/v1`)

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /novapay/status` | public | Config readiness (redacted) |
| `GET /novapay/health` | `X-Admin-Key` | Probe sandbox status |
| `GET /novapay/events` | `X-Admin-Key` | Proxy sandbox events |
| `POST /novapay/receive` | `X-Admin-Key` | Proxy sandbox receive |
| `POST /novapay/send` | `X-Admin-Key` | Proxy sandbox send |
| `POST /webhooks/novapay` | HMAC optional | Event ingress |

## Install

```bash
NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-novapay-partner.sh
```

Or manually:

```bash
mkdir -p apps/api/src/novapay
cp -R patches/nova-bank-api/novapay-partner/src/* apps/api/src/novapay/
```

```ts
// app.module.ts
import { NovaPayModule } from './novapay/novapay.module';

@Module({
  imports: [
    NovaPayModule.register({
      // ledger: { onVerifiedEvent: async (e) => { ... } },
    }),
  ],
})
export class AppModule {}
```

Prefer `NestFactory.create(AppModule, { rawBody: true })` for HMAC webhooks.

## Railway env

See [`.env.example`](../../../.env.example) and [`docs/NOVAPAY-NOVA-BANK-WIRING.md`](../../../docs/NOVAPAY-NOVA-BANK-WIRING.md).

```bash
NOVAPAY_ENABLED=true
NOVAPAY_SANDBOX_BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox
NOVAPAY_WEBHOOK_URL=https://nova-bank-api-production-7311.up.railway.app/api/v1/webhooks/novapay
NOVAPAY_WEBHOOK_SECRET=
```

## Tests

```bash
cd patches/nova-bank-api/novapay-partner && npm test
```
