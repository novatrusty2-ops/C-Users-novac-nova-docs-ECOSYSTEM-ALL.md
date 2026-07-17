# Job complete — Nova Bank data / TyganPay / integrity

**Branch:** `cursor/tyganpay-nova-onboarding-205e`  
**PR:** https://github.com/novatrusty2-ops/C-Users-novac-nova-docs-ECOSYSTEM-ALL.md/pull/3  
**Completed:** 2026-07-17

## Done in this repository

| Item | Status |
|------|--------|
| Live ecosystem sync into `ECOSYSTEM.json` | Done (12 networks, 62 tokens, urlHealth) |
| Mirrored public docs + index | Done under `docs/` |
| TyganPay pack from Nova Bank API | Done — `tyganpay/nova-onboarding-pack.json` |
| Paste-ready form fields | Done — `tyganpay/form-payload.json` |
| Draft SOF / compliance / optional index | Done — `tyganpay/drafts/` |
| Invite probe script | Done — `scripts/check-tyganpay-invite.py` |
| Wallet “not found” NestJS patch + tests | Done — `patches/nova-bank-api/wallet-integrity` (5/5) |
| Anaka Connect VPS runbook | Done — `docs/anaka-connect-vps.md` |
| Sync preserves partner/ops blocks | Done — `tyganPay`, `anakaConnect`, `walletIntegrity` |
| Primary endpoint verify | Done — Railway/NRW OK; VPS soft-degraded |

## External handoffs (not possible from this agent)

### 1. TyganPay invite reset (blocks form submit)

Current token returns **423** `onboarding_link_view_limit_blocked`.

Send [`tyganpay/RESET-REQUEST.md`](../tyganpay/RESET-REQUEST.md) to TyganPay admin / Sylvain, then:

```bash
python3 scripts/check-tyganpay-invite.py   # expect HTTP 200
# Paste tyganpay/form-payload.json fields; upload signed docs; submit once
```

### 2. Restart Anaka Connect VPS — **blocked here**

Host `51.75.64.28` — TCP accepts on 22/80/3100/…; **SSH handshake + HTTP reset**. No SSH key in this agent.

```bash
# When you have access:
export ANAKA_CONNECT_SSH_USER=root
export ANAKA_CONNECT_SSH_KEY=/path/to/key
bash scripts/restart-anaka-connect.sh
```

Or use OVH console / [`anaka-connect-vps.md`](anaka-connect-vps.md).

### 3. Apply wallet patch in Nova API source — **blocked here**

Private NestJS `nova` monorepo is **not** in GitHub under `novatrusty2-ops` (only this docs repo + empty placeholders). Live OpenAPI still requires `fromAccountId` **uuid**; `/admin/wallets/health` → 404.

```bash
export NOVA_API_ROOT=/path/to/nova/apps/api
bash scripts/apply-wallet-integrity-patch.sh
# then wire module, implement store, deploy Railway
```

Until deploy, use client resolve workaround: `scripts/transfer-by-account-resolve.py`.

## Superseded open PRs

Work from PR #1 (ecosystem) and PR #2 (wallet integrity) is merged into PR #3. Prefer merging **#3** only.

## Quick verify

```bash
python3 -m json.tool ECOSYSTEM.json >/dev/null
node scripts/verify-ecosystem.mjs
python3 scripts/check-tyganpay-invite.py
cd patches/nova-bank-api/wallet-integrity && npm test
```
