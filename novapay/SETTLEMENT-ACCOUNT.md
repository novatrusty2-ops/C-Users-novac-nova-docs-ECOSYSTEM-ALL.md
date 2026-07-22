# NovaPay settlement / beneficiary account

Configured for NovaPay sandbox portal defaults and onboarding pack fields.

| Field | Value |
|-------|--------|
| Account holder | **TOTAL DESIGN S.R.L.** |
| IBAN | `LT163250079884101461` |
| BIC / SWIFT | `REVOLT21` (Revolut Bank UAB) |
| Intermediary BIC | `CHASGB2L` (Bic banca intermedia — Chase UK) |
| Currency | EUR |

## Where wired

- Portal receive defaults: [`apps/novapay-portal/src/App.tsx`](../apps/novapay-portal/src/App.tsx)
- Onboarding pack: [`novapay/nova-onboarding-pack.json`](nova-onboarding-pack.json)
- Form payload: [`novapay/form-payload.json`](form-payload.json)
- Ecosystem: `ECOSYSTEM.json` → `novaPay.settlement`

## Notes

- Sandbox `POST /receive` accepts beneficiary IBAN/SWIFT; intermediary BIC is recorded for ops/wire instructions (API may ignore extra fields).
- `POST /send` must **not** include beneficiary fields.
- This is a Revolut business-style IBAN reference for NovaPay setup — not proof OpenPayd EMI is live.
- Keep bank ownership proof PDF for onboarding upload slot `BANK_ACCOUNT_OWNERSHIP_PROOF`.
