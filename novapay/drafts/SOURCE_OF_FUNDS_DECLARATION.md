# Source of Funds Declaration — DRAFT

**Status:** Draft for NovaPay upload slot `SOURCE_OF_FUNDS_DECLARATION`  
**Do not treat as a signed legal instrument until an authorized representative signs.**

---

**Client:** Nova Bank / Nova Bank Malta Ltd  
**Platform operator:** Anakatech LLC  
**Product:** Nova Bank Online  
**Partner rail:** NovaPay (external PSP onboarding — invite awaiting)  
**Date:** ________________

## Declaration

The undersigned authorized representative declares that funds and settlement flows related to this NovaPay onboarding are derived from:

1. **Operating capital** of Anakatech LLC / Nova Bank Malta Ltd for the Nova Bank Online platform.
2. **Client settlement activity** on Nova Bank Online ledger modules, subject to the published KYC/AML/CFT program.
3. **Fiat rails** via the EMI partner disclosed on the live Nova Bank API (`emiPartner`: OpenPayd) and institutional core banking via Hybx Finance / Apache Fineract (`https://fineract.hybxfinance.com`), when those rails are live.
4. **No retail branch cash deposits** — Nova Bank Online is a technology / ledger platform with partner EMI rails, not a cash-handling retail branch network.

Source-of-funds supporting evidence may include: company registration documents, EMI/partner account ownership proof, and platform compliance pack materials.

## Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Authorized representative | ________________ | ________________ | ________ |
| Compliance contact | privacy@anakatech.llc | ________________ | ________ |

---

_Evidence from live API (non-exhaustive): `features.malta.entityName=Nova Bank Malta Ltd`, `emiPartner=openpayd`, `vfaLicensed=true`; partner `novapay` mode `sandbox` on `/api/v1/partners/status`._
