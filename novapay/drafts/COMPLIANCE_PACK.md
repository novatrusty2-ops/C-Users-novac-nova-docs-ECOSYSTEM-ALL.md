# Compliance Pack Summary — DRAFT

**Status:** Draft cover sheet for NovaPay upload slot `COMPLIANCE_PACK`  
**Attach** the signed KYC/AML program extract and company docs; this page alone is not sufficient.

---

## Entities

| Item | Value |
|------|--------|
| Brand / client | Nova Bank |
| Legal entity (API) | Nova Bank Malta Ltd |
| Platform operator | Anakatech LLC |
| EMI partner (Nova API) | OpenPayd |
| Core banking | Hybx Fineract — https://fineract.hybxfinance.com |
| Production API | https://nova-bank-api-production-7311.up.railway.app/api/v1 |
| NovaPay sandbox status | https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status |
| Proposed callback | https://nova-bank-api-production-7311.up.railway.app/api/v1/webhooks/novapay |

## Program references (public)

| Doc | Location |
|-----|----------|
| KYC / AML / CFT | Nova API `GET /api/v1/public/docs/kyc` |
| Privacy & Terms | Nova API `GET /api/v1/public/docs/privacy` |
| Privacy contact | privacy@anakatech.llc |

## API regulatory signals (`features.malta`)

- `vfaLicensed`: true  
- `liveRailsEnabled`: true  
- `institutionApiLive`: true  
- `cryptoLiveEnabled`: false  
- `nrwTestnetOnly`: true  
- Banking integration surface: `provider=sandbox`, `realMoney=false` (as of pack generation)

## Attachments checklist

- [ ] Company registration documents (`COMPANY_REGISTRATION_DOCUMENTS`)
- [ ] Authorized representative passport (`AUTHORIZED_REPRESENTATIVE_PASSPORT`)
- [ ] Bank account ownership proof (`BANK_ACCOUNT_OWNERSHIP_PROOF`)
- [ ] Source of funds declaration (signed) (`SOURCE_OF_FUNDS_DECLARATION`)
- [ ] Optional supporting docs (`OPTIONAL_SUPPORTING_DOCUMENTS`)

## Acknowledgement

The client confirms it will not use NovaPay rails for sanctions evasion, money laundering, or activity prohibited under the Nova Bank Online KYC/AML/CFT program and applicable law.

**Authorized representative:** ________________  
**Date:** ________________  
**Signature:** ________________  
