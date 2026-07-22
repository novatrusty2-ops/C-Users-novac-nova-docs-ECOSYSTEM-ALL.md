# NovaPay settlement / beneficiary accounts

Configured for NovaPay sandbox portal defaults and onboarding pack fields.

## 1) EUR — Revolut

| Field | Value |
|-------|--------|
| Account holder | **TOTAL DESIGN S.R.L.** |
| IBAN | `LT163250079884101461` |
| BIC / SWIFT | `REVOLT21` (Revolut Bank UAB) |
| Intermediary BIC | `CHASGB2L` (Chase UK) |
| Currency | **EUR** |

## 2) EUR — Wise (business)

| Field | Value |
|-------|--------|
| Account holder | **GLOBAL LUXURY SRLS** |
| IBAN | `BE18905804591765` |
| BIC / SWIFT | `TRWIBEB1XXX` |
| Bank | Wise |
| Address | Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium |
| Currency | **EUR** |

## Where wired

- Portal account picker: [`apps/novapay-portal/src/accounts.ts`](../apps/novapay-portal/src/accounts.ts)
- Onboarding pack: [`novapay/nova-onboarding-pack.json`](nova-onboarding-pack.json)
- Form payload: [`novapay/form-payload.json`](form-payload.json)
- Ecosystem: `ECOSYSTEM.json` → `novaPay.settlement` (primary EUR Revolut) + `novaPay.settlementAccounts`

## Notes

- Sandbox `POST /receive` accepts beneficiary IBAN/SWIFT; intermediary BIC is for ops/wire instructions.
- `POST /send` must **not** include beneficiary fields.
- Both profiles are **EUR** business accounts for NovaPay sandbox / onboarding.
- Keep bank ownership proof PDFs for both IBANs (`BANK_ACCOUNT_OWNERSHIP_PROOF`).
