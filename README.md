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
NovaPay ↔ Nova Bank wiring: [`docs/NOVAPAY-NOVA-BANK-WIRING.md`](docs/NOVAPAY-NOVA-BANK-WIRING.md).  
NovaPay onboarding (Step 2 pack): [`docs/novapay-onboarding.md`](docs/novapay-onboarding.md).  
NovaPay portal (Railway): [`docs/novapay-portal-railway.md`](docs/novapay-portal-railway.md) · app [`apps/novapay-portal`](apps/novapay-portal).  
NovaPay bridge (NestJS-shaped proxy): [`apps/novapay-bridge`](apps/novapay-bridge).

```bash
npm run test:novapay                  # status → manifest → receive → send → events
npm run test:novapay:to               # Nova Bank → NovaPay sandbox e2e (+ 3 accounts)
npm run test:novapay-accounts         # smoke all 3 business settlement accounts
npm run test:novapay:all              # connect + e2e + accounts + bridge
npm run check:novapay-onboarding      # invite probe (awaiting_provider until URL set)
npm run test:novapay-bridge           # /api/v1/novapay/* bridge vs live sandbox
npm run start:novapay-bridge          # http://127.0.0.1:4080
npm run set:novapay-bridge-url -- https://<bridge-domain>   # step 3 catalog stamp
npm run dev:novapay-portal            # http://localhost:5180
npm run build:novapay-portal
# NestJS patch (needs local API checkout):
# NOVA_API_ROOT=/path/to/api bash scripts/install-novapay-partner.sh
```

App source: [`apps/nova`](apps/nova)

Deploy: [`.github/workflows/deploy-nova.yml`](.github/workflows/deploy-nova.yml) → GitHub Pages (`novablockchain.it.com`).
