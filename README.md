# Nova Wallet

**Production:** https://novablockchain.it.com/

OKX-style trading wallet for NovaONE, NRW World, DeFi Oracle (138), and the Nova mesh.

```bash
npm install
npm run dev:nova          # http://localhost:5174
npm run build:nova
npm test:nova
```

### Ecosystem sync (Python)

Regenerate `ECOSYSTEM.json` health + DBIS-138 explorer/token coverage from live Nova Bank APIs:

```bash
npm run sync:ecosystem    # fetch-api + python3 scripts/sync-ecosystem.py
npm run verify:ecosystem
```

Chain 138 docs: [`docs/dbis-138.md`](docs/dbis-138.md) (Blockscout / Etherscan-compatible API — not etherscan.io).

NovaPay sandbox (Railway): [`docs/novapay-sandbox-live-links.md`](docs/novapay-sandbox-live-links.md).

App source: [`apps/nova`](apps/nova)

Deploy: [`.github/workflows/deploy-nova.yml`](.github/workflows/deploy-nova.yml) → GitHub Pages (`novablockchain.it.com`).
