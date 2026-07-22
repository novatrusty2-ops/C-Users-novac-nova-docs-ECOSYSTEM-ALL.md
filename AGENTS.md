# AGENTS.md

## Cursor Cloud specific instructions

This repo is an npm monorepo with **two independent frontend products** (both static React 19 + Vite SPAs, no local database/backend):

- **Nova Wallet** — the primary product and the only declared root workspace (`apps/nova`). Run/test from the repo root.
- **Signet Wallet** — a standalone project in `apps/signet` with its **own `package-lock.json`**; it is NOT part of the root workspace. Install and run it separately from inside `apps/signet`.

The update script already runs `npm install` at the root (Nova) and in `apps/signet` (Signet), so dependencies are ready on startup.

### Run / test / build (dev servers stay running for the session)

Commands are defined in `package.json` (root and each app). Non-obvious notes:

- Nova: `npm run dev:nova` (→ http://localhost:5174), `npm run test:nova`, `npm run typecheck`, `npm run build:nova`.
- Signet: from `apps/signet`, `npm run dev` (→ http://localhost:5173), `npm test`, `npm run build`. Optional institutional "gate" server: `npm run gate` (→ http://localhost:8787, default access code `signet-institutional`); the app runs fine without it.
- **There is no lint tooling** (no ESLint/Prettier/Biome and no `lint` script). TypeScript `typecheck` (`tsc -b`) is the only static check; Nova exposes it as `npm run typecheck`.

### Gotchas

- Both wallets are fully client-side and talk to remote, already-hosted services (Nova Bank API on Railway, chain-138 RPC/Blockscout explorers, CoinGecko). These are NOT run from this repo and have graceful fallbacks, so the UIs render locally even when those endpoints are blocked/unreachable. State is kept in the browser keystore (localStorage), so wallet creation/unlock works offline.
- **Known Signet bug:** after creating/unlocking a Signet keystore, the dashboard currently crashes with a React "Maximum update depth exceeded" infinite loop originating in `ChartDataContextProvider` (`getSnapshot` not cached). This is a pre-existing application code defect, not an environment issue — Nova's create-keystore → dashboard flow works end to end.
- Ecosystem ops scripts (`npm run fetch-api`, `npm run sync:ecosystem`, `npm run verify:ecosystem`) require Python 3 and live network access to the Nova Bank API; they are optional and not needed to run either wallet.
