# TyganPay × Nova Bank — Client Onboarding Pack

Machine-readable field values: [`tyganpay/nova-onboarding-pack.json`](../tyganpay/nova-onboarding-pack.json)

## Invite status (blocked)

| Item | Value |
|------|--------|
| Token | `nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2` |
| URLs | `https://api.tyganpay.com/client-onboarding/...` · `https://test.tyganpay.com/client-onboarding/...` |
| API | `GET /api/public/client-onboarding/{token}` → **423** `onboarding_link_view_limit_blocked` |
| Reason | 15 client views used without a submitted change; 2 views reserved for TyganPay admin / Sylvain |

**Next step with TyganPay:** ask admin or Sylvain to **reset or re-issue** the invite. Do not keep opening the link — each view consumes the quota.

Optional uploads observed on the UI (all **PENDING** / **OPTIONAL**):

- `SOURCE_OF_FUNDS_DECLARATION`
- `BANK_ACCOUNT_OWNERSHIP_PROOF`
- `COMPLIANCE_PACK`
- `OPTIONAL_SUPPORTING_DOCUMENTS`

TyganPay’s UI also treats these as typical **mandatory** uploads before pack completion:

- `AUTHORIZED_REPRESENTATIVE_PASSPORT`
- `COMPANY_REGISTRATION_DOCUMENTS`

## Values taken from Nova Bank (live API + ECOSYSTEM)

Sourced 2026-07-17 from `GET /api/v1/global/status` and this repo’s `ECOSYSTEM.json`.

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
| Callback URL | `https://nova-bank-api-production-7311.up.railway.app/api/v1/webhooks/tyganpay` | Convention (confirm deploy) |
| Currency | EUR | EU / Malta posture |
| Bank region | EUROPE | Malta / EU |
| Account jurisdiction | Malta | Malta entity |
| EMI / banking partner | OpenPayd | `features.malta.emiPartner` |
| Core banking | Hybx Fineract (`fineract.hybxfinance.com`) | Ecosystem products |
| VFA licensed | `true` (API signal) | `features.malta.vfaLicensed` |
| Source of funds (draft text) | Operating capital and client settlement flows of Nova Bank Online / Anakatech LLC; fiat via OpenPayd EMI + Hybx/Fineract; no retail branch cash deposits | Derived from public KYC + malta features |

### Regulatory signals from Nova API (`features.malta`)

- `liveRailsEnabled`: true  
- `institutionApiLive`: true  
- `cryptoLiveEnabled`: false  
- `nrwTestnetOnly`: true  
- Banking provider: fineract (live)

## Still required from your side (not in public API)

Do **not** invent these. Attach real documents after the invite is reset:

1. Company registration number + registered office (Anakatech LLC and/or Nova Bank Malta Ltd)  
2. Incorporation date / company type as on the certificate  
3. Authorized representative full legal name, role, citizenship, DOB, passport  
4. Passport scan (`AUTHORIZED_REPRESENTATIVE_PASSPORT`)  
5. Company registration PDFs (`COMPANY_REGISTRATION_DOCUMENTS`)  
6. Bank account ownership proof for the settlement account  
7. Signed source-of-funds / compliance pack if TyganPay requires wet or digital signature  

## How to finish onboarding after reset

1. Open the **new** invite once; accept engagement rules and client copy.  
2. Paste company fields from `tyganpay/nova-onboarding-pack.json` → `clientProfile` + `proposedIntegration`.  
3. Fill banking block (region EUROPE, jurisdiction Malta, bank OpenPayd or “Other / not listed” with real IBAN details).  
4. Upload mandatory passport + company registration docs.  
5. Upload optional SOF / ownership / compliance pack if available.  
6. Sign and **Submit onboarding pack** in one session so views are not wasted.

## Related Nova Bank references

- API docs: https://nova-bank-api-production-7311.up.railway.app/api/v1/docs  
- OpenAPI: https://nova-bank-api-production-7311.up.railway.app/api/v1/openapi.json  
- KYC program: `GET /api/v1/public/docs/kyc` (operator Anakatech LLC)  
- Privacy contact: privacy@anakatech.llc  
