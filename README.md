# Signet Wallet v3

Self-custody multi-chain wallet for the Anaka mesh — **NovaOne**, **NRW World**, partner chains, and major EVM networks. Built with React 19, Vite, Tailwind (signet design tokens), ethers v6, Safe SDK, and WalletConnect.

## Stack

- **UI:** React 19, react-router-dom v7, Tailwind CSS, Recharts
- **Crypto:** ethers v6, @safe-global/protocol-kit, @walletconnect/web3wallet
- **Path alias:** `@/` → `src/`
- **Brand:** burgundy / gold / cream regal theme — tokens in `branding/brand-tokens.json`, synced via `npm run brand:sync`

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run test         # vitest suite (keystore, accounts, transfer, bridge, …)
npm run build        # → dist/
npm run preview
```

Canonical domain: **signetwallet.com**. Theme: deep burgundy / gold / cream. Chain accent colors: NovaOne `#8B5CF6`, NRW World `#A855F7`.

Optional institutional gate (private banking networks):

```bash
GATE_ACCESS_CODE=your-code npm run gate   # POST /verify { "code": "..." }
```

Set `VITE_GATE_URL=http://localhost:8787` in `.env` for the UI gate modal.

## Brand sync

```bash
npm run brand:sync     # writes src/lib/brand.generated.ts + src/brand/tokens.css
npm run brand:extract  # stub — instructions for asset extraction
npm run brand:icons    # stub — instructions for icon exports
```

## Deploy

```bash
chmod +x deploy.sh
./deploy.sh            # rsync dist → /var/www/anakatechllc-com/signet/
```

## Project layout

- `src/lib/*` — keystore, chains, bridge, swap, transfer, Safe, settings
- `src/context/*` — wallet + toast providers
- `src/hooks/*` — thin wrappers over libs
- `src/pages/*` — routed screens
- `src/components/*` — UI building blocks
- `server/gate/` — institutional access HTTP gate

## License

Private — Anakatech / Signet Wallet.
