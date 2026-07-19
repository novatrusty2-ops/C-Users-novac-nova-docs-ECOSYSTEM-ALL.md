# Nova Wallet

Trading-first mobile signer for **NovaONE + NRW World** — **separate product from Signet Wallet** (`apps/signet`).

- Theme: cool navy / teal / cyan (not Signet burgundy/gold)
- Chain accents: NovaONE `#0EA5E9`, NRW `#14B8A6` (not Signet purples)
- Storage: `nova.*` keys only (never `signet.*`)
- UX: bottom tabs — Portfolio · Swap · Activity · Settings
- No institutional gate, Safe UI, banks directory, or Signet branding

```bash
npm install
npm run dev        # :5174
npm run build
npm run test
./deploy.sh        # → /var/www/anakatechllc-com/nova
```

Bundle ID: `llc.anakatech.novawallet`
