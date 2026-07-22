# NovaPay provider invite — awaiting

**Status:** `awaiting_provider`  
**As of:** 2026-07-22

Nova Bank’s Railway partner sandbox (`/api/v1/partners/novapay/sandbox/*`) is live for loopback tests.  
There is **no external NovaPay client-onboarding portal or invite URL** yet.

## What this means

- Do **not** invent an invite token or fake `api.novapay.*` host.
- Pack files under [`novapay/`](.) are pre-filled from the public Nova Bank API + `ECOSYSTEM.json` so submission can happen in one session **after** a real provider invite exists.
- Settlement IBAN, registration number, and passport fields stay empty until compliance supplies them.

## When the provider is ready

1. Set env (do not commit secrets):

```bash
export NOVAPAY_ONBOARDING_URL='https://…/client-onboarding/…'
# or
export NOVAPAY_ONBOARDING_TOKEN='…'
export NOVAPAY_ONBOARDING_BASE='https://…'   # optional host for token path
```

2. Probe:

```bash
npm run check:novapay-onboarding
```

3. On HTTP 200 / usable invite: paste [`form-payload.json`](form-payload.json), upload drafts + mandatory docs, submit once.

## Related

- Guide: [`docs/novapay-onboarding.md`](../docs/novapay-onboarding.md)
- Sandbox links: [`docs/novapay-sandbox-live-links.md`](../docs/novapay-sandbox-live-links.md)
- Sandbox test: `npm run test:novapay`
