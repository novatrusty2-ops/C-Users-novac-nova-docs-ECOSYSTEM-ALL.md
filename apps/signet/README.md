# Signet Wallet

Institutional self-custody multi-chain SPA.

**Production:** https://signetwallet.com

**Separate from Nova Wallet** ([novablockchain.it.com](https://novablockchain.it.com/)) — Signet is not hosted on Nova’s Pages site.

```bash
npm run dev        # :5173
npm run build
./deploy.sh        # → /var/www/anakatechllc-com/signet → signetwallet.com
```

CI builds a `signet-wallet-dist` artifact (`.github/workflows/deploy-signet.yml`) for VPS deploy.
