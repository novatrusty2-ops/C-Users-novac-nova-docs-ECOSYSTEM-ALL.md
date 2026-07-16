# Wallet integrity diagnosis — "Wallet not found" on transfers

**Date:** 2026-07-16  
**Environment probed:** `https://nova-bank-api-production-7311.up.railway.app`  
**Affected account numbers:** `6379` (EUR Real Fiat), `9873` (USD Real Fiat), `5017` (USD Local Ledger)

## Verdict

Transfers fail with `404 Wallet not found` when `fromAccountId` is a **4-digit account number**. The transfer path looks up wallets by **UUID primary key only** and does not resolve account numbers. This is reproducible for a freshly registered user's own funded-path account (`1140` → UUID works; `"1140"` → Wallet not found).

A secondary gap is likely: ledger import / Real Fiat promotion can leave **account-registry rows without transferable wallet rows**. That cannot be confirmed for 6379/9873/5017 without the owning JWT (non-owner UUID lookups also return the same 404).

## 1. Where is the wallet layer?

| Question | Finding |
|----------|---------|
| Separate microservice? | **No.** Wallets are served by the same NestJS app on Railway as accounts/transfers. |
| Module shape | In-process module: `GET /api/v1/wallets` is documented as *"alias of accounts extended"* and returns the same UUID `id` as `GET /api/v1/accounts`. |
| Storage | Persistent DB behind Railway (`/api/v1/health` → `database: up`). Not an in-memory map for production. |
| Offline peer | Protocol peers list `http://localhost:3001` as m1 offline — not involved in the Railway transfer 404. |

Wallet DTO (from live `GET /wallets` after registration) includes fields accounts omit: `userId`, `type` (`user_crypto` / fiat equivalent), `pending`. Transfer code clearly goes through a wallet lookup, not the public account-number registry alone.

## 2. How are wallets created?

| Path | Creates wallets? |
|------|------------------|
| `POST /auth/start` (new user) | **Yes — automatic.** New member received 30 account/wallet pairs (fiat local ledgers + crypto vaults). |
| Dedicated `POST /wallets` create | **No** such endpoint in OpenAPI. |
| `POST /wallets/{accountId}/fund` | Sandbox only; production returns *Sandbox funding is disabled*. |
| `POST /ledger/import/admin/all-to-account` | Credits ledger balances (admin). **Does not guarantee** a transferable wallet row — this is the likely gap for import-funded accounts. |
| First transfer | **Does not auto-create today.** Missing/mismatched id → hard 404. |

## 3. Why do 6379 / 9873 / 5017 fail?

### Confirmed (any account, including healthy ones)

```text
fromAccountId = "1140"   → 404 Wallet not found   (own account number)
fromAccountId = <uuid>   → past wallet check        (own account UUID)
fromAccountId = "9873"   → 404 Wallet not found   (verification curl shape)
```

OpenAPI marks `TransferByAccount.fromAccountId` as `format: uuid`, but clients (and the verification curl) pass 4-digit numbers. The handler does not resolve `accountNumber → accountId` before `findWallet`.

### Account registry (these accounts exist)

| Account | UUID | Owner userId | Currency | Protocol / label |
|---------|------|--------------|----------|------------------|
| 6379 | `05a2f2e5-f5e0-4dee-b99f-df1474dc761e` | `9c6c672a-…` | EUR | `real` / EUR Real Fiat |
| 9873 | `52b8cb06-2127-4be4-9cb2-45e071174bdb` | `309ccd03-…` | USD | `real` / USD Real Fiat |
| 5017 | `f21b31c2-14a8-4986-98b4-c6abe1dbdea3` | `309ccd03-…` | USD | `offline` / USD Local Ledger |
| 7318 (dest) | `06e71624-b085-4f4c-8ae4-998f7dce9e14` | `309ccd03-…` | EUR | `real` / EUR Real Fiat |

`GET /accounts/{number}` and `GET /accounts/resolve/me?accountNumber=` succeed for all four. Registration-created users only get `offline` Local Ledger fiat — **Real Fiat (`protocol: real`) accounts are created on a different path** (promote / import), which is why missing wallet rows remain plausible for 6379/9873 even after number→UUID is fixed.

### Error variants observed

| Call | Message |
|------|---------|
| `POST /transfers/by-account` bad/missing wallet id | `Wallet not found` |
| `POST /transfers` non-owned / missing source | `Source wallet not found` |
| Own UUID, no PIN, USD→USD | `Daily fiat outbound limit exceeded for tier 0` (wallet OK) |
| PIN `0000` | `Invalid PIN format` (rejected before wallet auth) |
| Other wrong PIN | `Invalid banking PIN` |

## 4. Is the wallet service on VPS `:3100` vs Railway?

| Target | Result from this agent |
|--------|------------------------|
| Railway primary | **Running.** `GET /api/v1/health` 200; transfers executed here. |
| `51.75.64.28:3100` | **Unreachable** (connection reset / timeout on `:3100` and other probed ports from this environment). |
| ECOSYSTEM `deployed.bridgeRelayerVps` | `51.75.64.28` is the **bridge relayer** host (`/opt/nova-bridge-adapter`), not the custodial wallet/transfer API. |

**Conclusion:** Transfer wallet lookups run on the **Railway** Nova Bank API. There is no separate wallet microservice on `:3100` in the live path we exercised.

## Source-code constraint

This repository is the **ecosystem manifest** (`ECOSYSTEM.json`), not the NestJS app. Application code lives in the private `nova` monorepo (`generatedFrom: "nova"`). The fix package under `patches/nova-bank-api/wallet-integrity/` is written to drop into that API and must be deployed to Railway to clear production.

## Immediate client workaround (no deploy)

Resolve account number → UUID, then transfer:

```bash
# 1) Resolve
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/v1/accounts/resolve/me?accountNumber=9873"
# → accountId

# 2) Transfer with UUID + Idempotency-Key (PIN must not be 0000)
curl -sS -X POST "$BASE/api/v1/transfers/by-account" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"<accountId-uuid>","toAccountNumber":"7318","amount":"1","pin":"<pin>","reference":"WALLET-TEST"}'
```

See also `scripts/transfer-by-account-resolve.py`.
