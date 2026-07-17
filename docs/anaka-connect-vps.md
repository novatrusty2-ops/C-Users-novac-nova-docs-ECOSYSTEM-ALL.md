# Anaka Connect VPS — `novaBankVPS`

**Host:** `51.75.64.28` → `vps-58bb86af.vps.ovh.net` (OVH SAS, Frankfurt)  
**Env:** `ANAKA_CONNECT_BASE=http://51.75.64.28`  
**Role:** Anaka Connect middleware between AnakaBank services and Nova Bank Online (Railway)

## What it is

Not “just a wallet server.” Anaka Connect is the integration layer every AnakaBank service treats as `novaBankVPS`:

- Ledger bridge / SWIFT / settlement / custody  
- Trade finance / cross-chain bridge / multi-fiat  
- Crypto vaults / RWA / super bridge / external banking  
- Officer auth paths that are VPS-only (e.g. `bnieh@proton.me`)

Railway holds the custodial ledger (balances can show as present). Anaka Connect is what makes those balances **spendable** from AnakaBank’s side.

```
AnakaBank services
       │
       ▼  ANAKA_CONNECT_BASE
┌──────────────────────────┐
│  51.75.64.28             │
│  Anaka Connect /         │
│  novaBankVPS             │
└────────────┬─────────────┘
             ▼
   Nova Bank API (Railway)
   nova-bank-api-production-7311
```

## Live status (rechecked 2026-07-17)

| Check | Result |
|-------|--------|
| DNS / reverse | `51.75.64.28` ↔ `vps-58bb86af.vps.ovh.net` ✓ |
| TCP ports (22, 80, 443, 3000–3100, 9338, 13000, …) | **Accept** (SYN/ACK) |
| HTTP `http://51.75.64.28/novaone-rpc/` | **Connection reset by peer** |
| HTTP `http://51.75.64.28:28545/rpc` | **Connection reset by peer** |
| Railway `GET /api/v1/global/status` | **ok** |
| NRW World RPC (Railway) | **ok** |

Same failure mode as 2026-07-16: TCP up, HTTP app stack down. Restart Anaka Connect on the VPS.

Interpretation: the **machine is up**, but the **Anaka Connect app stack is not serving** (process down, reverse-proxy misconfig, or firewall half-open). That matches “bridge offline → Wallet not found / officer login dead / all `novaBankVPS` callers stuck.”

SSH (`:22`) accepts connections from this environment, but **no deploy key / credentials** are available in this agent — someone with OVH/SSH access must restart the stack.

## Bring it back up (ops runbook)

**Automated (preferred):** from this repo, with SSH key:

```bash
export ANAKA_CONNECT_SSH_USER=root          # or deploy user
export ANAKA_CONNECT_SSH_KEY=~/.ssh/id_ed25519
# optional: export ANAKA_CONNECT_SSH_PORT=2222
bash scripts/restart-anaka-connect.sh
```

Recheck 2026-07-17 from cloud agent: TCP open on 22/2222/80/3100/…; **SSH kex reset** and **HTTP reset** — credentials or console access still required.

Manual SSH:

```bash
ssh root@51.75.64.28   # or the deploy user for vps-58bb86af

# Identify Anaka Connect / bridge process
ss -lntp | egrep '3100|3000|80|443'
systemctl list-units --type=service --state=running | egrep -i 'anaka|nova|connect|bridge|pm2'
pm2 list 2>/dev/null
ls -la /opt/nova-bridge-adapter /opt/anaka* 2>/dev/null

# Typical recovery (adjust to actual unit/pm2 name)
cd /opt/nova-bridge-adapter   # or Anaka Connect install path
docker compose ps 2>/dev/null || true
pm2 restart all 2>/dev/null || systemctl restart anaka-connect

# Verify
curl -sS http://127.0.0.1:3100/health
curl -sS http://127.0.0.1/health
```

External verify after restart:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28:3100/health
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28/health
```

Expect **200** (not connection reset).

## Relationship to the Railway “Wallet not found” patch

Two layers:

1. **Anaka Connect down (this VPS)** — AnakaBank → `novaBankVPS` cannot resolve/spend wallets. **Bringing the VPS back is the primary fix for AnakaBank.**
2. **Railway API quirk** — calling Railway *directly* with a 4-digit `fromAccountId` still 404s (`docs/wallet-integrity-diagnosis.md`). That remains a separate NestJS fix in the `nova` monorepo.

Ledger balances on Railway can be real while Anaka Connect is offline; spendability from AnakaBank requires the bridge.
