# Anaka Connect VPS — `novaBankVPS`

**Host:** `51.75.64.28` → `vps-58bb86af.vps.ovh.net` (OVH SAS, Frankfurt)  
**Env:** `ANAKA_CONNECT_BASE=http://51.75.64.28`  
**Role:** Anaka Connect middleware between AnakaBank services and Nova Bank Online (Railway)

## What it is

Not “just a wallet server.” Anaka Connect is the integration layer every AnakaBank service treats as `novaBankVPS`:

- Ledger bridge / SWIFT / settlement / custody  
- Trade finance / cross-chain bridge / multi-fiat  
- Crypto vaults / RWA / super bridge / external banking  
- Officer auth paths that are VPS-only

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

## Live status (rechecked 2026-07-17T15:16Z)

| Check | Result |
|-------|--------|
| DNS / reverse | `51.75.64.28` ↔ `vps-58bb86af.vps.ovh.net` ✓ |
| TCP ports (22, 2222, 80, 443, 3000, 3100, 9338, 28545) | **Accept** (SYN/ACK) |
| HTTP `http://51.75.64.28/health` | **Connection reset by peer** |
| HTTP `http://51.75.64.28:3100/health` | **Connection reset by peer** |
| SSH `:22` / `:2222` | **kex connection reset** |
| Railway `GET /api/v1/global/status` | **ok** |

Interpretation: the **machine is up**, but the **Anaka Connect app stack is not serving** (process down, reverse-proxy misconfig, or firewall half-open). SSH from external agents also resets during key exchange — use the **OVH KVM/console**, not remote SSH.

## Primary fix: OVH KVM / console

1. Open [OVH Manager](https://www.ovh.com/manager/) → **Bare Metal Cloud** → **VPS** → `vps-58bb86af` → **Console** / **KVM**.
2. Log in as `root` (or the deploy user).
3. Paste this entire recovery block:

```bash
echo "== listeners =="
ss -lntp | egrep '3100|3000|80|443' || netstat -lntp 2>/dev/null | egrep '3100|3000|80|443' || true

echo "== services =="
systemctl list-units --type=service --state=running 2>/dev/null | egrep -i 'anaka|nova|connect|bridge|pm2|nginx|caddy' || true
pm2 list 2>/dev/null || true
ls -la /opt/nova-bridge-adapter /opt/anaka* /srv/anaka* 2>/dev/null || true

echo "== restart =="
pm2 restart all 2>/dev/null || true
systemctl restart anaka-connect 2>/dev/null || \
  systemctl restart nova-bridge 2>/dev/null || \
  systemctl restart nova-connect 2>/dev/null || true
if [ -d /opt/nova-bridge-adapter ]; then
  cd /opt/nova-bridge-adapter
  docker compose ps 2>/dev/null || true
  docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || true
fi
# reverse proxy if present
systemctl restart nginx 2>/dev/null || systemctl restart caddy 2>/dev/null || true

sleep 2
echo "== local health =="
curl -sS -m 5 -o /dev/null -w "local3100=%{http_code}\n" http://127.0.0.1:3100/health || echo "local3100=ERR"
curl -sS -m 5 -o /dev/null -w "local80=%{http_code}\n" http://127.0.0.1/health || echo "local80=ERR"
```

4. Expect `local3100=200` and ideally `local80=200`. Paste the full console output back to the ops thread if either is not `200`.

### If health still fails after restart

```bash
# Find what owns the ports
ss -lntp
# Check failed units / recent crashes
systemctl --failed
journalctl -xe -n 80 --no-pager
pm2 logs --lines 80 2>/dev/null || true
# Docker stack logs
if [ -d /opt/nova-bridge-adapter ]; then
  cd /opt/nova-bridge-adapter
  docker compose logs --tail=80 2>/dev/null || docker-compose logs --tail=80 2>/dev/null || true
fi
```

Also fix SSH if you need remote ops later (fail2ban / MaxStartups / broken sshd):

```bash
systemctl status ssh sshd fail2ban 2>/dev/null | head -80
journalctl -u ssh -u sshd -n 40 --no-pager 2>/dev/null || true
# last resort after confirming console login works:
# systemctl restart ssh || systemctl restart sshd
```

## Automated SSH restart (only when SSH works)

From this repo, with a working key:

```bash
export ANAKA_CONNECT_SSH_USER=root
export ANAKA_CONNECT_SSH_KEY=~/.ssh/id_ed25519
# optional: export ANAKA_CONNECT_SSH_PORT=2222
bash scripts/restart-anaka-connect.sh
```

As of 2026-07-17T15:16Z this fails with `kex_exchange_identification: Connection reset by peer` — console is required.

## External verify after recovery

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28:3100/health
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28/health
```

Expect **200** (not connection reset).

## Relationship to the Railway “Wallet not found” patch

Two layers:

1. **Anaka Connect down (this VPS)** — AnakaBank → `novaBankVPS` cannot resolve/spend wallets. **Bringing the VPS back is the primary fix for AnakaBank.**
2. **Railway API quirk** — calling Railway *directly* with a 4-digit `fromAccountId` still 404s. That remains a separate NestJS fix in the `nova` monorepo.

Ledger balances on Railway can be real while Anaka Connect is offline; spendability from AnakaBank requires the bridge.
