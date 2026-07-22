# NovaPay portal — Railway deploy

Sandbox ops dashboard for NovaPay (status, events, receive/send). Talks to the existing Nova Bank partner sandbox API — no NestJS changes required.

## Local

```bash
npm install
npm run dev:novapay-portal    # http://localhost:5180
npm run build:novapay-portal
```

Env (optional): [`apps/novapay-portal/.env.example`](../apps/novapay-portal/.env.example)

## Railway — create the service

This repo ships the app + Dockerfile. **You** create the Railway service (agent cannot attach a new Railway project from here).

1. Open [Railway](https://railway.app) → your Nova workspace.
2. **New** → **GitHub Repo** → `C-Users-novac-nova-docs-ECOSYSTEM-ALL.md` (or this ecosystem repo).
3. Set **Root Directory** to `apps/novapay-portal`.
4. Builder: Dockerfile (`apps/novapay-portal/Dockerfile` / `railway.toml`).
5. Variables (build arg / env):
   - `VITE_NOVAPAY_SANDBOX_BASE` = `https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox`
6. **Generate domain** → copy HTTPS URL (e.g. `https://novapay-portal-production-xxxx.up.railway.app`).
7. Open the domain — expect NovaPay brand, live status, events table.
8. Tell the team / open a PR to set that URL in:
   - `ECOSYSTEM.json` → `novaPay.portalUrl`
   - `apps/nova/src/lib/partners.ts` → NovaPay `url`
   - [`docs/novapay-sandbox-live-links.md`](novapay-sandbox-live-links.md)

## Health

- Portal: `GET /healthz` → `ok`
- Upstream sandbox status:  
  https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status

## Notes

- Sandbox only — banner on the portal; no live funds.
- `POST /receive` may include IBAN/SWIFT; `POST /send` must not.
- NestJS `sandboxUiUrl` still points at JSON status until updated in `nova-bank-api`.
