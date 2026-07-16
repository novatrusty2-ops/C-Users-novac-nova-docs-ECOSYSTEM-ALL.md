# Wallet integrity patch (Nova Bank API)

Drop-in NestJS module for the private `nova` monorepo API that:

1. Resolves `fromAccountId` when it is a 4-digit account number
2. Auto-creates a missing wallet from the account registry on transfer (warn log)
3. Adds `POST /api/v1/admin/wallets/repair`
4. Adds `GET /api/v1/admin/wallets/health`
5. Adds `hasWallet` on `GET /api/v1/accounts/:accountNumber`

## Root cause (live)

`POST /transfers/by-account` looks up wallets by UUID only. Passing `"fromAccountId":"9873"` always 404s with `Wallet not found`, even when the account and (for registration-created users) the wallet exist under a UUID.

## Install into `nova` API

```bash
# From nova monorepo root (NestJS API app)
cp -R path/to/this/patch/src/* apps/api/src/wallet-integrity/
# or merge files into existing accounts/transfers/wallets modules
```

Wire the module:

```ts
// app.module.ts
import { WalletIntegrityModule } from './wallet-integrity/wallet-integrity.module';

@Module({
  imports: [
    // ...existing
    WalletIntegrityModule,
  ],
})
export class AppModule {}
```

### Required host adapters

Implement `WalletIntegrityStore` against your real TypeORM/Prisma repositories (see `store.interface.ts`). The default `InMemoryWalletIntegrityStore` is for unit tests only.

Minimum store methods:

- `listAccounts()` — all account-registry rows (number, id, userId, currency, protocol, balances)
- `findAccountByNumber(accountNumber)`
- `findAccountById(id)`
- `findWalletById(id)`
- `createWalletFromAccount(account)` — insert wallet row with **same id** as account (production shape)
- `countWallets()`
- `isWalletServiceHealthy()` — DB ping / module ready

### Transfer hook

In `TransfersService.transferByAccount` (before debit):

```ts
const wallet = await this.walletIntegrity.ensureSourceWallet(
  dto.fromAccountId,
  req.user.id,
);
// use wallet.id as the canonical fromAccountId
```

### Accounts response

In the `GET /accounts/:accountNumber` mapper, add:

```ts
hasWallet: await this.walletIntegrity.hasWallet(account.id),
```

### Admin auth

Repair/health routes use the existing `X-Admin-Key` guard (same as ledger import).

## Deploy

Ship this with the Railway Nova Bank API service (`nova-bank-api-production-7311`). VPS `51.75.64.28:3100` is not the custodial wallet host.

## Verify after deploy

```bash
export BASE=https://nova-bank-api-production-7311.up.railway.app
export TOKEN=...   # owner of 9873
export ADMIN_KEY=...

curl -sS -X POST "$BASE/api/v1/admin/wallets/repair" -H "X-Admin-Key: $ADMIN_KEY"
curl -sS "$BASE/api/v1/admin/wallets/health" -H "X-Admin-Key: $ADMIN_KEY"
curl -sS "$BASE/api/v1/accounts/9873" -H "Authorization: Bearer $TOKEN"
# expect hasWallet: true

curl -sS -X POST "$BASE/api/v1/transfers/by-account" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"9873","toAccountNumber":"7318","amount":"1","pin":"<pin>","reference":"WALLET-TEST"}'
# expect 200/201 — not Wallet not found
# note: pin "0000" is rejected as Invalid PIN format by production
```

## Tests

```bash
cd patches/nova-bank-api/wallet-integrity
npm test
```
