# Nova Bank Ecosystem Manifest

Canonical ecosystem manifest for the Anakatech LLC Nova fintech stack. This is **not** the Nova Bank NestJS application source (`nova` monorepo).

- **Live API:** https://nova-bank-api-production-7311.up.railway.app/api/v1

## Anaka Connect VPS / wallet integrity (2026-07-16)

`51.75.64.28` (`vps-58bb86af.vps.ovh.net`, Frankfurt OVH) is **Anaka Connect** — `ANAKA_CONNECT_BASE` / `novaBankVPS` — the middleware between AnakaBank and Nova Bank Railway. TCP accepts; HTTP resets → **app stack down**. Ledger can be real on Railway while spendability from AnakaBank is blocked until the VPS is restarted.

| Artifact | Path |
|----------|------|
| Anaka Connect / VPS runbook | [`docs/anaka-connect-vps.md`](docs/anaka-connect-vps.md) |
| Railway transfer diagnosis | [`docs/wallet-integrity-diagnosis.md`](docs/wallet-integrity-diagnosis.md) |
| NestJS patch (account-number resolve, repair, health, `hasWallet`) | [`patches/nova-bank-api/wallet-integrity`](patches/nova-bank-api/wallet-integrity) |
| Client workaround | [`scripts/transfer-by-account-resolve.py`](scripts/transfer-by-account-resolve.py) |

**Ops priority:** SSH to the VPS and restart Anaka Connect (see runbook). This agent has no SSH credentials.

**Secondary:** Railway still 404s when `fromAccountId` is a 4-digit account number (UUID required) — apply the NestJS patch in the private `nova` API repo.

```bash
cd patches/nova-bank-api/wallet-integrity && npm test
```
