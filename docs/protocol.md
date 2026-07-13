# Nova Sync Protocol

_Source: Nova Bank API public docs · updated 2026-07-13T10:12:00.269Z_

# Nova Bank Protocols

## What is Protocol 101.1?

**Protocol 101.1** is a version label used in two related but distinct ways: in the **Visa card industry** for payment authorization, and in **Nova Bank** for online/offline server sync. Both appear in this app — do not treat them as the same system.

### Visa Protocol 101.1 (card transactions)

In card-processing terms, **Visa Protocol 101.1** is described as a standardized method for processing Visa card transactions. It is designed to move payment data securely between:

| Party | Role |
|-------|------|
| **Customer** | Provides Visa card details (number, expiry, amount, CVV) to the merchant |
| **Merchant** | Initiates the transaction at checkout or point of sale |
| **Acquiring bank** | Receives and processes the authorization request on behalf of the merchant |
| **Visa network (VisaNet)** | Routes the request, runs validation and risk checks, returns approve/decline |

**Typical flow:**

```
Customer → Merchant → Acquirer → VisaNet → Approve / Decline → Settlement
```

**What it is used for:**

- **Transaction initiation** — capture card details and request authorization for a specific amount
- **Secure data transfer** — card data travels through regulated channels, not ad-hoc “codes” or scripts
- **Pre-authorization completion** — often a second step where the cardholder confirms with a **one-time 6-digit code** (similar to 3-D Secure) before the charge is finalized

In Nova Bank, this maps to **Visa Card Authorization 101.1** on the **Cards** tab: *Start pre-authorization* (step 1) → *Complete payment* with 6-digit OTP (step 2).

### Nova Sync 101.1 (banking infrastructure)

Separately, Nova Bank uses **Nova Sync 101.1** for how the web app, online server (m0), and offline server (m1) stay in sync — wallets, transfers, IBAN/SWIFT rails, and queued operations when connectivity drops. This is **internal app architecture**, not a Visa network specification.

### Fraud warning

Claims that “Protocol 101.1” unlocks **special transaction privileges**, unlimited funds, or bypasses normal banking controls are **not legitimate**. They are commonly used in scams. Nova Bank implements only:

- Standard **pre-authorization + OTP verification** for card payments
- Normal **Nova Sync** for online/offline banking — no privilege bypass

---

## Two protocols in Nova Bank

Nova Bank uses **two separate protocols** that share the version number `101.1` but serve different purposes:
| Protocol | Name | Purpose |
|----------|------|---------|
| **Nova Sync** | `Nova Sync 101.1` | Online/offline server sync, m0/m1 routing, wallets, transfers |
| **Visa Card Auth** | `Visa Card Authorization 101.1` | Two-step card pre-authorization + 6-digit OTP completion |

---
## Nova Sync 101.1 — Online/Offline Server Integration

### Architecture

```
                    ┌─────────────────────┐
                    │   Web Client        │
                    │  (protocol router)  │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │ HTTPS            │ IndexedDB         │
           ▼                  ▼                   │
   ┌───────────────┐  ┌──────────────┐          │
   │ Online Server │  │ Offline Queue│          │
   │  (Railway)    │  │  (browser)   │          │
   └───────┬───────┘  └──────┬───────┘          │
           │                  │                   │
           │    POST /sync/push (when online)     │
           └──────────────────┘                   │
```

### Headers

| Header | Value |
|--------|-------|
| `X-Nova-Protocol` | `101.1` |
| `X-Nova-Server-Mode` | `online` \| `offline` \| `degraded` |
| `X-Nova-Module` | `m0` \| `m1` — routes request to correct node |
| `Idempotency-Key` | Required for mutations |

### Modules

| Module | Role | Description |
|--------|------|-------------|
| **m0** | Online primary | Global Railway API, USD/Visa cards |
| **m1** | Offline edge | Local offline node, EUR/Mastercard cards |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/protocol/status` | This node's module, role, sync paths |
| GET | `/protocol/capabilities` | Supported operations + m0/m1 modules |
| GET | `/servers/peers` | Online + offline server registry |
| POST | `/sync/push` | Push offline operation batch |
| GET | `/sync/pull?since=cursor` | Pull transactions since cursor |

### Client module routing

| Operation | Module | Target node |
|-----------|--------|-------------|
| fund, transfer, exchange | m0 | Online primary |
| online card issue/status | m0 | Online primary |
| offline card issue/status | m1 | Offline edge (fallback m0 if shared DB) |
| sync push / pull | m0 | Online primary |
| settlement run | m0 | Online primary |
| degraded queue | — | IndexedDB until primary returns |

---

## Ledger → Local Ledger → Real Money

Legitimate **ledger-to-ledger (L2L)** transfer between paired user accounts — not a secret protocol or cloud fund-unlock service.

| Tier | Module | UI label | Role |
|------|--------|----------|------|
| Ledger | m0 (online) | Ledger | Funded account — sandbox credit or inbound wire |
| Local Ledger | m1 (offline) | Local Ledger | Working fiat balance — exchange, Hybx receive, cards |
| Meta Fiat | m2 (meta) | Meta Fiat | Settlement pool — admin promote from m1; real rails exit |

Each user has **paired fiat wallets** per currency (USD, EUR, GBP): Ledger (online), Local Ledger (offline), and Meta Fiat (settlement pool, provisioned on first promote).

### Flow

1. **Fund Ledger** — `POST /wallets/:id/fund` (sandbox) or `POST /external/deposit` (inbound wire to m1)
2. **Create send order** — `POST /ledger-send/orders` with `{ fromAccountId, amount, currency }` (m0 → m1)
3. **Deduct / credit** — atomic journal (`ledger-to-local`): debit m0, credit paired m1
4. **Promote to Meta Fiat** — admin `POST /settlement/meta/promote` (m1 → m2 settlement pool)
5. **Convert to real** — only from Meta Fiat (m2):
   - `POST /ledger-send/convert` with `kind: bank_transfer` → external outbound
   - `POST /external/transfer` → same outbound rail (SWIFT or **Topups/Anaka Connect** when `TOPUPS_OUTBOUND_ENABLED=true`)
   - Topups flow: Anaka Connect `POST /topups/server/create|record|treasury/` (server-side; cap via `TOPUPS_MAX_TRANSFER_USD`, e.g. **$1M** in production)
   - Other kinds (`cash_withdrawal`, `goods_services`, `real_assets`) return unavailable until licensed partners are wired

### Rules

- Only **Ledger (online)** accounts can initiate send orders to Local Ledger
- Only **Meta Fiat (m2)** accounts can pay out to external rails
- Inbound deposits credit **Local Ledger (m1)**; promote to meta is admin-only
- Insufficient balance rejects the send before any journal post

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ledger-send/orders` | Send from Ledger → Local Ledger |
| GET | `/ledger-send/orders` | List user's send orders |
| POST | `/ledger-send/convert` | Convert Local Ledger balance to real rails |
| POST | `/settlement/meta/promote` | Admin: promote m1 → Meta Fiat (m2) |
| POST | `/settlement/meta/run-route` | Admin: run m1-meta-bank settlement workflow |
| GET | `/settlement/meta/status` | Admin: meta / m1 balances |

Sync operation type: `ledger_send` (routes to m1 module).

---

## Settlement — Ledger to Real Rails

Nova Bank reads the **double-entry ledger** on system accounts and converts internal balances to **real rails payouts** via the banking provider.

### System accounts

| Type | Role |
|------|------|
| `card_reserve` | Card spend accumulated from customer wallets |
| `system_float` | External outbound/inbound float |
| `nostro_settlement` | Clearing pool before real payout |
| `real_rails_outbound` | Confirmed payouts to external network |

### Flow

1. **Read ledger** — `GET /settlement/summary`, `GET /settlement/ledger/system`, `GET /settlement/ledger/mine`
2. **Clear** — journal debits source (`card_reserve` or `system_float`), credits `nostro_settlement`
3. **Payout** — `BankingProvider.initiateWithdrawal()` then journal debits nostro, credits `real_rails_outbound`
4. **Track** — `settlement_batches` + `settlement_batch_items` link each batch to card auths or external transfers

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settlement/summary` | System balances, unsettled counts, recent batches |
| GET | `/settlement/ledger/system` | All system account ledger balances |
| GET | `/settlement/ledger/mine` | User's journal entry history |
| GET | `/settlement/activity` | Unified activity (transfer + card + external) |
| GET | `/settlement/batches` | Settlement batch history |
| POST | `/settlement/run` | Run `{ kind: card_clearing \| external_clearing, currency }` |

---

## Visa Card Authorization 101.1

Standard two-step card transaction flow for virtual Visa cards:

### Step 1 — Initiate pre-authorization

`POST /cards/preauth/initiate` (authenticated)

```json
{
  "cardId": "...",
  "merchant": "Demo Merchant",
  "amount": "25.00",
  "pan": "4000...",
  "expiryMonth": 12,
  "expiryYear": 2028,
  "cvv": "123"
}
```

Validates card number, expiry, CVV, and wallet balance. Returns a pending pre-auth ID and (in sandbox) a 6-digit OTP.

### Step 2 — Complete with OTP

`POST /cards/preauth/:id/complete`

```json
{ "otp": "482910" }
```

Verifies the 6-digit code (expires in 5 minutes), posts the ledger entry, and marks the pre-auth completed.

### Merchant production API

For checkout integrations at `NODE_ENV=production`, use **merchant endpoints** with `X-Merchant-Key` (value of `MERCHANT_AUTH_SECRET`). The OTP is **never** returned to the merchant — only to the cardholder out-of-band.

**Step 1 — Initiate**

`POST /cards/merchant/preauth/initiate`

Headers: `X-Merchant-Key`, `Idempotency-Key`

Same body as member initiate (cardId, merchant, amount, pan, cvv, expiry).

**Step 2 — Poll status (optional)**

`GET /cards/merchant/preauth/:preAuthId`

**Step 3 — Complete with cardholder OTP**

`POST /cards/merchant/preauth/:preAuthId/complete`

```json
{ "otp": "482910" }
```

CLI: `npm run merchant:preauth -- -Action initiate -CardId ... -Pan ... -Cvv ...`

### VisaNet integration (Marqeta)

Nova routes **Visa network** authorizations through **Marqeta** (Visa-licensed processor). You do not connect to Visa Inc. directly.

| Endpoint | Purpose |
|----------|---------|
| `GET /visa/status` | Marqeta / VisaNet connection status |
| `POST /visa/marqeta/jit-funding` | JIT gateway — Marqeta calls this on Visa authorizations |

Set `CARD_PROVIDER=visa` (or `marqeta`) and `MARQETA_*` credentials. Configure the JIT URL in Marqeta dashboard:

`{GLOBAL_PUBLIC_URL}/api/v1/visa/marqeta/jit-funding`

Setup: `npm run visa:setup`

### Sandbox note

The OTP is returned in the API response for demo purposes. Production would deliver it via SMS or banking app push — never as a “privilege unlock” code.

---

## Server modes

| Mode | Behavior |
|------|----------|
| **online** | All requests go to primary server (Railway) |
| **offline** | Local/offline node serves cached data |
| **degraded** | No server reachable — IndexedDB cache + queued ops |

When back online, client auto-syncs queued operations and pulls updates every 30s.

## Environment

**Web** (`apps/web/.env.local`):
```
VITE_GLOBAL_API_URL=https://api.yourdomain.com/api/v1
VITE_OFFLINE_API_URL=http://localhost:3001/api/v1
```

**API primary** (`apps/api/.env` or Railway):
```
NOVA_SERVER_ROLE=primary
GLOBAL_PUBLIC_URL=https://api.yourdomain.com
OFFLINE_SERVER_URL=http://localhost:3001
```

**API offline node** (`apps/api/.env.offline`):
```
NOVA_SERVER_ROLE=offline
PORT=3001
GLOBAL_PUBLIC_URL=https://api.yourdomain.com
OFFLINE_SERVER_URL=http://localhost:3001
```

## Local dual-node stack

```powershell
.\start-protocol-stack.ps1   # m0 + m1 + web (recommended)
# or manually:
.\start-online.ps1    # primary on :3000
.\start-offline.ps1   # offline on :3001
npm run dev --workspace=@nova/web
```

## Railway deploy

```powershell
.\deploy-global.ps1
```

Requires a free service slot on Railway. If the plan limit is hit, delete unused services (e.g. duplicate Postgres) or upgrade, then redeploy.

## Manual sync

Click **Sync now** in the UI when badge shows `Offline · queued`.

