# NovaPay × Nova Bank — Client Onboarding Pack (Step 2)

| Artifact | Path |
|----------|------|
| Field pack | [`novapay/nova-onboarding-pack.json`](../novapay/nova-onboarding-pack.json) |
| Paste-ready form | [`novapay/form-payload.json`](../novapay/form-payload.json) |
| Draft SOF | [`novapay/drafts/SOURCE_OF_FUNDS_DECLARATION.md`](../novapay/drafts/SOURCE_OF_FUNDS_DECLARATION.md) |
| Draft compliance cover | [`novapay/drafts/COMPLIANCE_PACK.md`](../novapay/drafts/COMPLIANCE_PACK.md) |
| Awaiting provider | [`novapay/AWAITING-PROVIDER.md`](../novapay/AWAITING-PROVIDER.md) |
| Invite probe | [`scripts/check-novapay-onboarding.py`](../scripts/check-novapay-onboarding.py) |
| Sandbox live links | [`docs/novapay-sandbox-live-links.md`](novapay-sandbox-live-links.md) |

## Invite status (awaiting provider)

| Item | Value |
|------|--------|
| Token / URL | **Not issued** |
| Probe | `npm run check:novapay-onboarding` → `awaiting_provider` |
| Sandbox (separate) | Railway `/api/v1/partners/novapay/sandbox/*` already works for loopback tests |

```bash
npm run check:novapay-onboarding
# After invite exists:
# NOVAPAY_ONBOARDING_URL='https://…' npm run check:novapay-onboarding
```

**Next step with NovaPay provider:** issue a client-onboarding invite for Nova Bank Malta Ltd. Do not invent hosts or tokens.

## Values taken from Nova Bank (live API + ECOSYSTEM)

| NovaPay field | Suggested value | Source |
|---------------|-----------------|--------|
| Client / brand | Nova Bank | Product |
| Company legal name | **Nova Bank Malta Ltd** | `features.malta.entityName` |
| Platform operator | **Anakatech LLC** | `ECOSYSTEM.json` → `organization` |
| Jurisdiction | Malta | Malta entity on live API |
| Company email / privacy | privacy@anakatech.llc | Public privacy docs |
| Client review email | novatrusty2@gmail.com | Account owner for this repo |
| Preferred language | English | Default |
| Product | Nova Bank Online | `global/status.name` |
| Proposed endpoint | `https://nova-bank-api-production-7311.up.railway.app/api/v1` | Live API |
| Callback URL | `…/api/v1/webhooks/novapay` | Convention (confirm NestJS deploy) |
| Currency | EUR | EU / Malta posture |
| Bank region | EUROPE | Malta / EU |
| Account jurisdiction | Malta | Malta entity |
| Bank name (select) | Other / not listed | Confirm real IBAN with compliance |
| EMI / banking partner (Nova side) | OpenPayd | `features.malta.emiPartner` |
| Core banking | Hybx Fineract | Ecosystem products |
| VFA licensed | `true` (API signal) | `features.malta.vfaLicensed` |
| Transaction types | `payout,s2s_api` | NovaPay sandbox manifest |

### Regulatory signals from Nova API (`features.malta`)

- `liveRailsEnabled`: true  
- `institutionApiLive`: true  
- `cryptoLiveEnabled`: false  
- `nrwTestnetOnly`: true  
- Banking provider (integration surface): sandbox (`realMoney`: false)

## Settlement account (configured)

See [`novapay/SETTLEMENT-ACCOUNT.md`](../novapay/SETTLEMENT-ACCOUNT.md).

| Field | Value |
|-------|--------|
| Account holder | TOTAL DESIGN S.R.L. |
| IBAN | LT163250079884101461 |
| BIC | REVOLT21 |
| Intermediary BIC | CHASGB2L |

## Still required from your side (not in public API)

1. External NovaPay provider invite  
2. Company registration number + registered office  
3. Incorporation date as on the certificate  
4. Authorized representative identity + passport scan  
5. Company registration PDFs  
6. Bank account ownership proof PDF for the IBAN above  
7. Sign the draft SOF / compliance cover (or replace with counsel-approved PDFs)  

## How to finish after invite

1. Set `NOVAPAY_ONBOARDING_URL` or `NOVAPAY_ONBOARDING_TOKEN` (+ optional base).  
2. Run `npm run check:novapay-onboarding` — expect HTTP 200 / usable invite.  
3. Open the invite once; accept engagement rules and client copy.  
4. Paste non-null fields from `novapay/form-payload.json` → `fields`.  
5. Fill banking IBAN details under bank “Other / not listed” if needed.  
6. Upload passport + company registration; attach signed drafts for optional slots.  
7. Sign and **submit onboarding pack** in one session.

## Related Nova Bank references

- API docs: https://nova-bank-api-production-7311.up.railway.app/api/v1/docs  
- OpenAPI: https://nova-bank-api-production-7311.up.railway.app/api/v1/openapi.json  
- Partners status: https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/status  
- KYC program: `GET /api/v1/public/docs/kyc`  
- Privacy contact: privacy@anakatech.llc  
- Sandbox test: `npm run test:novapay`
