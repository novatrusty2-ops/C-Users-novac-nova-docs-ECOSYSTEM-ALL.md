# Anakatech Wallets

Two **separate** wallet products — different brands, themes, storage, UX, and deploy targets.

| | **Signet Wallet** | **Nova Wallet** |
|---|---|---|
| Path | `apps/signet` | `apps/nova` |
| Domain | [signetwallet.com](https://signetwallet.com) · [Pages /signet](https://novablockchain.it.com/signet/) | [novablockchain.it.com](https://novablockchain.it.com/) (owns apex) |
| Role | Institutional self-custody SPA | Trading-first mobile signer |
| Theme | Regal burgundy / gold / cream | OKX black / teal trading dashboard |
| Default chains | Full Anaka mesh + public EVMs | **NovaONE + NRW World** only |
| Chain accents | NovaONE `#8B5CF6` · NRW `#A855F7` | NovaONE `#0EA5E9` · NRW `#14B8A6` |
| Storage keys | `signet.*` | `nova.*` |
| Ports | `5173` / `4173` | `5174` / `4174` |
| Deploy | Pages `/signet/` + Anakatech VPS | Pages `/` (apex) |

They do **not** share UI themes, localStorage namespaces, or product positioning.

## Quick start

```bash
npm install                 # workspaces: apps/signet + apps/nova

npm run dev:signet          # http://localhost:5173
npm run dev:nova            # http://localhost:5174

npm run build:signet
npm run build:nova
npm test
```

## Signet (`apps/signet`)

Self-custody multi-chain wallet — Safe multisig, WalletConnect, institutional gate, banks directory, bridge/swap, PWA.

```bash
cd apps/signet && npm run dev
cd apps/signet && ./deploy.sh   # nginx atomic deploy
```

## Nova (`apps/nova`)

OKX Wallet / Nova Bank dashboard layout — Assets · Trade · History · Me. Separate product from Signet.


Lean trading wallet for the Nova mesh — Portfolio / Swap / Activity / Settings tabs. No institutional gate, no Safe UI, no Signet branding.

```bash
cd apps/nova && npm run dev
cd apps/nova && ./deploy.sh
```

## Production (GitHub Pages) — split hosts

| Product | Production URL | Theme |
|---------|----------------|-------|
| **Nova Wallet** | https://novablockchain.it.com/ | OKX black / teal (owns apex) |
| **Signet Wallet** | https://signetwallet.com · [Pages mirror](https://novablockchain.it.com/signet/) | Burgundy / gold / cream |

Deployed by [`.github/workflows/deploy-production.yml`](.github/workflows/deploy-production.yml) on push to `main`.

- Nova builds with `base: /` (domain root)
- Signet Pages mirror builds with `VITE_BASE=/signet/`
- Products do **not** share UI, storage (`nova.*` / `signet.*`), or branding

`signetwallet.com` remains Signet’s canonical Anakatech VPS deploy.

