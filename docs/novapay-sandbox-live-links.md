# NovaPay sandbox — live links

Partner sandbox on Railway `nova-bank-api` (`nova-bank-api-production-7311`). Deploy probe: SUCCESS. Mode: `sandbox`. Partner: `novapay`. Auth: `none`.

## Status

- https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status

Live `status` returns `enabled=true`, `configured=true`, and sets `sandboxUiUrl` to the Railway URL above.

## Settlement account (TOTAL DESIGN S.R.L.)

| Field | Value |
|-------|--------|
| Holder | TOTAL DESIGN S.R.L. |
| IBAN | LT163250079884101461 |
| BIC | REVOLT21 |
| Intermediary BIC | CHASGB2L |

Details: [`novapay/SETTLEMENT-ACCOUNT.md`](../novapay/SETTLEMENT-ACCOUNT.md). Portal receive form defaults to this account.

## Portal (own dashboard)

Sandbox ops UI lives in [`apps/novapay-portal`](../apps/novapay-portal). Deploy steps: [`docs/novapay-portal-railway.md`](novapay-portal-railway.md).

```bash
npm run dev:novapay-portal     # local http://localhost:5180
npm run build:novapay-portal
```

After Railway **Generate domain**, put the HTTPS URL in `ECOSYSTEM.json` → `novaPay.portalUrl` (currently `null` until first deploy).

## Sandbox endpoints (Railway)

Base: `https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox`

| Endpoint | Method | Notes |
|----------|--------|--------|
| `status` | GET | enabled / configured / URL map |
| `manifest` | GET | EUR payout sample + submit/callback URLs |
| `receive` | POST | Accepts payout; refs like `NOVA-PAY-SANDBOX-…` |
| `send` | POST | Loopback send → `completed` |
| `callback` | POST | Status callback target |
| `events` | GET | Sandbox event log |

## Dual host note

Live `status` / `manifest` still advertise **`novabank.uk`** for submit / receive / send / callback / manifest, while `sandboxUiUrl` is Railway. Both hosts serve the same Nova Bank API surface; prefer Railway for ops probes.

Railway equivalents:

- `…/sandbox/receive`
- `…/sandbox/send`
- `…/sandbox/callback`
- `…/sandbox/manifest`
- `…/sandbox/events`

## Manifest sample (live)

From `GET …/sandbox/manifest`:

- Partner: NovaPay Sandbox
- Institution: Nova Bank Online
- Transaction type: payout
- Currency: EUR
- Auth: none

```json
{
  "transactionType": "payout",
  "amount": "10000.00",
  "currency": "EUR",
  "reference": "NOVA-NOVAPAY-SANDBOX-001",
  "beneficiaryName": "Sandbox Beneficiary",
  "beneficiaryIban": "LT823250062405612558",
  "beneficiarySwift": "REVOLT21"
}
```

## Probe summary (2026-07-22)

| Endpoint | Result |
|----------|--------|
| `status` | `enabled=true`, partner=`novapay` |
| `manifest` | returns submit/callback URLs |
| `receive` | accepted (`NOVA-PAY-SANDBOX-…`) |
| `send` (loopback) | `completed` |
| `events` | 3 rows |

This is a **sandbox** rail (`realMoney` remains false on the banking surface). Not production fiat settlement.

## Connect + test (this repo)

Nova Wallet surfaces NovaPay under Settings → Nova Bank and Ecosystem → Live APIs / Partners.

```bash
npm run test:novapay
```

Exercises Railway sandbox: `status` → `manifest` → `receive` → `send` → `events` (no auth, no live funds).

- `POST /receive` accepts the manifest payout sample (beneficiary fields allowed).
- `POST /send` is loopback outbound — send `{ amount, currency, reference, transactionType }` only (no beneficiary fields).

## Step 2 — client onboarding pack

External NovaPay provider invite is **not issued yet**. Pre-filled pack + drafts:

- Guide: [`docs/novapay-onboarding.md`](novapay-onboarding.md)
- Pack: [`novapay/nova-onboarding-pack.json`](../novapay/nova-onboarding-pack.json)
- Status: [`novapay/AWAITING-PROVIDER.md`](../novapay/AWAITING-PROVIDER.md)

```bash
npm run check:novapay-onboarding
```
