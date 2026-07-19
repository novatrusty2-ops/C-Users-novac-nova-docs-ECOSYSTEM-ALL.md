# Nova Wallet

Trading-first mobile signer — **OKX Wallet / Nova Bank dashboard** layout.

**Production:** https://novablockchain.it.com/nova/

Separate product from Signet Wallet (different theme, storage `nova.*`, UX shell).

## Layout

- **Assets** — total balance, circular quick actions, Crypto / NovaONE·NRW segments, flat token list
- **Trade** — stacked swap panels
- **History** — activity feed
- **Me** — profile, Nova Bank, partners, networks, security

## Dev

```bash
npm run dev          # http://localhost:5174
VITE_BASE=/nova/ npm run build   # production subpath
./deploy.sh          # optional nginx mirror
```
