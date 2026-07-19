# Nova API (custody)

Server-side **DFNS** + **Cobo** for Nova Wallet. Secrets never ship to the browser.

```bash
# from repo root — requires gitignored .env + secrets/dfns-rsa2048.pem
npm run api:smoke
npm run api:dev     # http://localhost:8787
```

| Route | Description |
|-------|-------------|
| `GET /health` | Liveness |
| `GET /api/custody/status` | Provider config flags (no secrets) |
| `GET /api/custody/dfns/wallets` | List DFNS wallets |
| `GET /api/custody/cobo/wallets` | List Cobo wallets |

Point the Nova SPA at this API with `VITE_CUSTODY_API_URL=http://localhost:8787`.
