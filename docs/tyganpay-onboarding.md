# TyganPay × Nova Bank — Client Onboarding Pack

| Artifact | Path |
|----------|------|
| Field pack | [`tyganpay/nova-onboarding-pack.json`](../tyganpay/nova-onboarding-pack.json) |
| Paste-ready form | [`tyganpay/form-payload.json`](../tyganpay/form-payload.json) |
| Draft SOF | [`tyganpay/drafts/SOURCE_OF_FUNDS_DECLARATION.md`](../tyganpay/drafts/SOURCE_OF_FUNDS_DECLARATION.md) |
| Draft compliance cover | [`tyganpay/drafts/COMPLIANCE_PACK.md`](../tyganpay/drafts/COMPLIANCE_PACK.md) |
| Invite probe | [`scripts/check-tyganpay-invite.py`](../scripts/check-tyganpay-invite.py) |

## Invite status (blocked)

| Item | Value |
|------|--------|
| Token | `nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2` |
| URLs | `https://api.tyganpay.com/client-onboarding/...` · `https://test.tyganpay.com/client-onboarding/...` |
| API | `GET /api/public/client-onboarding/{token}` → **423** `onboarding_link_view_limit_blocked` |
| Reason | 15 client views used without a submitted change; 2 views reserved for TyganPay admin / Sylvain |

```bash
python3 scripts/check-tyganpay-invite.py
```

**Next step with TyganPay:** ask admin or Sylvain to **reset or re-issue** the invite. Do not keep opening the link.

Optional uploads observed on the UI (all **PENDING** / **OPTIONAL**):

- `SOURCE_OF_FUNDS_DECLARATION`
- `BANK_ACCOUNT_OWNERSHIP_PROOF`
- `COMPLIANCE_PACK`
- `OPTIONAL_SUPPORTING_DOCUMENTS`

Typical **mandatory** uploads before pack completion:

- `AUTHORIZED_REPRESENTATIVE_PASSPORT`
- `COMPANY_REGISTRATION_DOCUMENTS`

## Values taken from Nova Bank (live API + ECOSYSTEM)

| TyganPay field | Suggested value | Source |
|----------------|-----------------|--------|
| Client / brand | Nova Bank | Invite token prefix + product |
| Company legal name | **Nova Bank Malta Ltd** | `features.malta.entityName` |
| Platform operator | **Anakatech LLC** | `ECOSYSTEM.json` → `organization` |
| Jurisdiction | Malta | Malta entity on live API |
| Company email / privacy | privacy@anakatech.llc | Public privacy docs |
| Client review email | novatrusty2@gmail.com | Account owner for this repo |
| Preferred language | English | Default |
| Product | Nova Bank Online | `global/status.name` |
| Proposed endpoint | `https://nova-bank-api-production-7311.up.railway.app/api/v1` | Live API |
| Callback URL | `…/api/v1/webhooks/tyganpay` | Convention (confirm deploy) |
| Currency | EUR | EU / Malta posture |
| Bank region | EUROPE | Malta / EU |
| Account jurisdiction | Malta | Malta entity |
| Bank name (select) | Other / not listed | Confirm real IBAN with compliance |
| EMI / banking partner | OpenPayd | `features.malta.emiPartner` |
| Core banking | Hybx Fineract | Ecosystem products |
| VFA licensed | `true` (API signal) | `features.malta.vfaLicensed` |
| Transaction types | `swift_iso20022,s2s_api` | TyganPay rail defaults |

### Regulatory signals from Nova API (`features.malta`)

- `liveRailsEnabled`: true  
- `institutionApiLive`: true  
- `cryptoLiveEnabled`: false  
- `nrwTestnetOnly`: true  
- Banking provider: fineract (live)

## Still required from your side (not in public API)

1. Company registration number + registered office  
2. Incorporation date as on the certificate  
3. Authorized representative identity + passport scan  
4. Company registration PDFs  
5. Bank account ownership proof (settlement IBAN)  
6. Sign the draft SOF / compliance cover (or replace with counsel-approved PDFs)  
7. TyganPay invite reset  

## How to finish after reset

1. Run `python3 scripts/check-tyganpay-invite.py` — expect HTTP 200 / `ok: true`.  
2. Open the **new** invite once; accept engagement rules and client copy.  
3. Paste non-null fields from `tyganpay/form-payload.json` → `fields`.  
4. Fill banking IBAN details under bank “Other / not listed” if OpenPayd is not listed.  
5. Upload passport + company registration; attach signed drafts for optional slots.  
6. Sign and **Submit onboarding pack** in one session.

## Related Nova Bank references

- API docs: https://nova-bank-api-production-7311.up.railway.app/api/v1/docs  
- OpenAPI: https://nova-bank-api-production-7311.up.railway.app/api/v1/openapi.json  
- KYC program: `GET /api/v1/public/docs/kyc`  
- Privacy contact: privacy@anakatech.llc  
