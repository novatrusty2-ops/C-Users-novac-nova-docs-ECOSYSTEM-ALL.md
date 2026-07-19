# DFNS & Cobo custody credentials

Secrets live **only** in gitignored files on the machine / CI secrets store:

| File | Contents |
|------|----------|
| `.env` | DFNS token, cred ID, org ID; Cobo API key + secret |
| `secrets/dfns-rsa2048.pem` | DFNS service-account RSA private key |

Never commit `.env`, `*.pem`, or `secrets/`.

## Smoke test

```bash
node scripts/custody-smoke-test.mjs
```

Expected: `DFNS: OK` and `COBO: OK` (no secret values printed).

## Notes

- **DFNS** — Bearer token for reads; `AsymmetricKeySigner` (cred ID + PEM) for signed actions via `@dfns/sdk`.
- **Cobo** — Ed25519 request signatures (`Biz-Api-Key` / `Biz-Api-Nonce` / `Biz-Api-Signature`). Current key authenticated against **production** `https://api.cobo.com/v2`. Temporary key expires **2026-08-01**; register a permanent IP-whitelisted key when a static server IP is available. Callback URL not registered yet (needed before withdrawals).
