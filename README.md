# Nova Bank Ecosystem Manifest

Canonical ecosystem manifest for the Anakatech LLC Nova fintech stack. This is **not** the Nova Bank NestJS application source (`nova` monorepo).

- **Live API:** https://nova-bank-api-production-7311.up.railway.app/api/v1

## Anaka Connect VPS (ops priority)

`51.75.64.28` (`vps-58bb86af.vps.ovh.net`, Frankfurt OVH) is **Anaka Connect** — `ANAKA_CONNECT_BASE` / `novaBankVPS` — the middleware between AnakaBank and Nova Bank Railway.

| Artifact | Path |
|----------|------|
| OVH console runbook | [`docs/anaka-connect-vps.md`](docs/anaka-connect-vps.md) |
| SSH restart script | [`scripts/restart-anaka-connect.sh`](scripts/restart-anaka-connect.sh) |

**Current state (2026-07-17):** TCP accepts; HTTP and SSH **connection reset**. Remote agents cannot restart the stack — use **OVH KVM/console** and paste the recovery block in the runbook.

```bash
# Only works when SSH is healthy:
export ANAKA_CONNECT_SSH_USER=root
export ANAKA_CONNECT_SSH_KEY=~/.ssh/id_ed25519
bash scripts/restart-anaka-connect.sh
```

After console recovery, external checks should return **200**:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28:3100/health
curl -sS -o /dev/null -w "%{http_code}\n" http://51.75.64.28/health
```

## Contents

| Path | Purpose |
|------|---------|
| [`ECOSYSTEM.json`](ECOSYSTEM.json) | Networks, tokens, products, bridges, Anaka Connect health |
| [`docs/anaka-connect-vps.md`](docs/anaka-connect-vps.md) | VPS recovery (OVH console first) |
| [`scripts/restart-anaka-connect.sh`](scripts/restart-anaka-connect.sh) | Probe + SSH restart when credentials work |
