# Nova Wallet

**Production:** https://novablockchain.it.com/

OKX-style trading wallet for NovaONE, NRW World, and the Nova mesh. Connect MetaMask, Trust, SafePal, Gate, OKX, Coinbase, Rabby, Brave, Bitget, and other injected Web3 wallets. Institutional custody via DFNS + Cobo through `apps/nova-api` (keys stay server-side).

```bash
npm install
npm run dev:nova          # http://localhost:5174
npm run api:dev           # custody API http://127.0.0.1:8787
npm run api:smoke         # DFNS + Cobo smoke (needs .env + PEM)
npm run build:nova
npm test:nova
```

| Path | Role |
|------|------|
| [`apps/nova`](apps/nova) | OKX-style SPA (Vite + React) |
| [`apps/nova-api`](apps/nova-api) | DFNS + Cobo custody proxy |

Frontend env (optional): `VITE_CUSTODY_API_URL=http://127.0.0.1:8787`, `VITE_WALLETCONNECT_PROJECT_ID=…`

Deploy: [`.github/workflows/deploy-nova.yml`](.github/workflows/deploy-nova.yml) → GitHub Pages (`novablockchain.it.com`). Host `nova-api` separately (Railway/VPS) — never put DFNS/Cobo secrets in Pages.
