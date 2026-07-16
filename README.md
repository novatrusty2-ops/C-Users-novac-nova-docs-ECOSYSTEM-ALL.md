# Nova Bank Ecosystem Manifest

Canonical ecosystem manifest for the Anakatech LLC Nova fintech stack. This is **not** the Nova Bank NestJS application source (`nova` monorepo).

- **Live API:** https://nova-bank-api-production-7311.up.railway.app/api/v1

## Wallet integrity (2026-07-16)

Transfers returning `404 Wallet not found` for accounts that exist in the registry:

| Artifact | Path |
|----------|------|
| Diagnosis | [`docs/wallet-integrity-diagnosis.md`](docs/wallet-integrity-diagnosis.md) |
| API patch (repair + health + auto-create + account-number resolve) | [`patches/nova-bank-api/wallet-integrity`](patches/nova-bank-api/wallet-integrity) |
| Client workaround | [`scripts/transfer-by-account-resolve.py`](scripts/transfer-by-account-resolve.py) |

**Confirmed root cause:** `POST /transfers/by-account` looks up wallets by UUID only. Passing a 4-digit `fromAccountId` (e.g. `"9873"`) always 404s — including for the caller's own account. Railway hosts the wallet/transfer path; VPS `51.75.64.28:3100` is not in that path.

**Deploy:** apply the patch in the private `nova` API repo and redeploy Railway. Until then, use the resolve script (account number → UUID) as a client workaround.

```bash
cd patches/nova-bank-api/wallet-integrity && npm test
```
