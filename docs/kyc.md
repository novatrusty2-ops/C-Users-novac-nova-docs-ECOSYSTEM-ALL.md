# KYC / AML / CFT Program (Full)

_Source: Nova Bank API public docs · updated 2026-07-13T10:11:59.568Z_

# Nova Bank Online — KYC / AML / CFT Program (Full Detail)

**Document:** KYC-AML-FULL v1.0  
**Operator:** Anakatech LLC (Nova Bank Online platform)  
**Effective:** June 2026  
**Scope:** Nova Bank API, member web app, Nova Swap, wallet ecosystem, Hybx/Fineract rails, chain settlement

---

## 1. Purpose & regulatory posture

Nova Bank Online operates a **ledger-backed member banking platform** with optional connection to:

- **Hybx Finance** (Apache Fineract) for institutional savings and inbound settlement
- **SWIFT / GPI / MT103** wire rails (sandbox and production providers)
- **Wise** and **Revolut** B2B partner rails
- **Visa** virtual card pre-authorization (Marqeta sandbox/production)
- **Multi-chain custody** (DeFi Oracle Chain 138, NovaONE 22016, NRW World 33001, AnakaChain 11013, ALLTRA 651940)

This program defines **Know Your Customer (KYC)**, **Anti-Money Laundering (AML)**, and **Counter-Terrorist Financing (CFT)** controls for all member-facing fiat and crypto activity.

> **Important:** Nova Bank Online is a technology platform. The operator must hold or partner with appropriately licensed entities (EMI, payment institution, MSB, VASP where applicable) in each jurisdiction before offering real-money services to retail or institutional clients.

---

## 2. Customer identification program (CIP)

### 2.1 Onboarding data collected

| Field | Required | Verification |
|-------|----------|--------------|
| Full legal name | Yes | ID document match |
| Email | Yes | OTP / magic link |
| 4-digit banking PIN | Yes | Hashed (bcrypt), never stored plaintext |
| Date of birth | Yes (Tier 2+) | Government ID |
| Residential address | Yes (Tier 2+) | Proof of address ≤ 90 days |
| Nationality / tax residency | Yes (Tier 2+) | Self-declaration + ID |
| Government ID (passport / national ID / driver licence) | Tier 2+ | Liveness + document OCR |
| Source of funds / wealth (SOF/SOW) | Tier 3+ | Declaration + supporting docs |
| Beneficial ownership (entities) | B2B | UBO register, ≥25% threshold |

### 2.2 Identity verification provider (target integration)

Production target: **Sumsub**, **Onfido**, or equivalent with:

- Document authenticity checks
- Facial liveness
- PEP & sanctions screening at onboarding
- Ongoing monitoring webhooks

**Current system state:** `users.kyc_status` ∈ `pending` | `verified` | `rejected` (database field). Provider integration is on the production checklist.

### 2.3 Record retention

| Data class | Retention |
|------------|-----------|
| KYC documents & verification results | 5 years after relationship ends (or longer per local law) |
| Transaction records | 7 years |
| SAR / STR filings | 5 years from filing |
| Audit logs (`audit_logs` table) | 7 years |

---

## 3. Customer due diligence (CDD) tiers

### Tier 0 — Restricted (default at signup)

- **Status:** `kyc_status = pending`
- **Limits:** Internal ledger only; sandbox fund if enabled; no real-rail outbound
- **Products:** View balances, internal exchange (sandbox), protocol education

### Tier 1 — Basic verified

- **Requirements:** Email + PIN + government ID + selfie liveness
- **Limits (indicative):** Fiat outbound ≤ **USD 10,000 / day**; crypto withdraw ≤ **USD 25,000 / day**
- **Products:** m1 Local Ledger full use; cards (online Visa sandbox); Hybx receive (subject to Fineract client approval)

### Tier 2 — Standard

- **Requirements:** Tier 1 + proof of address + SOF declaration
- **Limits (indicative):** Fiat outbound ≤ **USD 250,000 / day**; wires enabled from Meta Fiat (m2) after admin promote
- **Products:** SWIFT outbound, Wise/Revolut partners, trade finance instruments (LC/SBLC) subject to credit review

### Tier 3 — Enhanced (EDD)

- **Triggers:** PEP, high-risk jurisdiction, single transaction > **USD 1,000,000**, adverse media, complex ownership
- **Requirements:** Senior management approval, enhanced SOF/SOW documentation, ongoing enhanced monitoring
- **Limits:** Custom per compliance committee
- **Products:** OMNL institutional BTC L1 settlement, large Hybx savings movements, NRW ecosystem mint operations

### Tier 4 — Institutional / correspondent

- **Requirements:** Legal entity verification, licensed status proof, AML reliance letter or Wolfsberg questionnaire, signed ICA
- **Products:** Fineract API settlement routes, OMNL journals, admin meta-fiat promote, batch settlement

---

## 4. Fiat ledger tiers & KYC gating

Nova Bank uses a **three-tier fiat model** (see `docs/PROTOCOL.md`):

| Module | Protocol | Label | KYC gate |
|--------|----------|-------|----------|
| **m0** | `online` | Ledger | Tier 0+ inbound; Tier 1+ outbound staging |
| **m1** | `offline` | Local Ledger | Tier 1+ working balance; Hybx receive credits m1 only |
| **m2** | `meta` | Meta Fiat (Settlement pool) | Tier 2+; **admin promote only**; only m2 may exit to real rails |

**Settlement flow:** m1 → (admin `POST /settlement/meta/promote`) → m2 → bank wire / SWIFT / partner payout.

Members with `kyc_status != verified` must not receive m2 promotion or real-rail debits.

---

## 5. Sanctions, PEP & adverse media

### 5.1 Screening lists (minimum)

- OFAC SDN (US)
- EU consolidated list
- UN Security Council
- UK HMT / OFSI
- Local jurisdiction lists as required

### 5.2 Screening points

| Event | Screening |
|-------|-----------|
| Account opening | Full name, DOB, nationality, address |
| Each wire beneficiary | IBAN, name, BIC country |
| Hybx receive | Fineract client external ID cross-check |
| Crypto withdraw | On-chain address risk score (Chainalysis/Elliptic target) |
| Daily batch | Full customer base rescreen |

### 5.3 PEP handling

- Domestic PEP: EDD + senior approval for Tier 3
- Foreign PEP: EDD mandatory; relationship may be declined
- RCA (close associates): same as PEP for Tier 3

---

## 6. Transaction monitoring

### 6.1 System rules (implement in `audit_logs` + rules engine)

| Rule ID | Description | Action |
|---------|-------------|--------|
| TM-001 | Single outbound > USD 50,000 without Tier 2 | Block + review |
| TM-002 | Cumulative 24h outbound > tier daily limit | Block + review |
| TM-003 | Rapid m1→m2 promote + immediate wire (structuring) | Flag SAR review |
| TM-004 | Inbound Hybx >> declared SOF | EDD trigger |
| TM-005 | Crypto→fiat→wire within 1h (layering pattern) | Flag |
| TM-006 | Beneficiary in high-risk jurisdiction | EDD / block |
| TM-007 | Round-dollar institutional journals (OMNL) | Compliance sign-off required |

### 6.2 Suspicious Activity Reports (SAR/STR)

Compliance officer files with relevant FIU when:

- Knows, suspects, or has reasonable grounds to suspect ML/TF
- Cannot justify transaction vs customer profile
- Customer refuses to provide SOF on request

**Internal escalation:** `compliance@anakatech.llc` (configure per deployment).

---

## 7. Product-specific controls

### 7.1 Visa virtual cards

- Card issuance: Tier 1+ verified
- Pre-authorization: 6-digit OTP to cardholder (never to merchant)
- Merchant API: `X-Merchant-Key` in production; no OTP leakage
- PCI: Card PAN/CVV stored encrypted (`card-vault`); production requires PCI DSS assessment

### 7.2 Hybx / Fineract

- Each member linked savings account maps to Fineract `externalId`
- Receive credits **m1 only**; withdrawal from Hybx savings requires Fineract transaction + Nova reconcile
- Institutional OMNL BTC L1: dual journal (Nova ledger + Fineract GL offices 1 & 3)

### 7.3 Crypto vaults

- Deposit addresses per vault (Fireblocks / OneX / sandbox)
- Withdraw: Tier 1+; address whitelist optional Tier 2+
- Chain 138 (DBIS): primary EVM custody; NovaONE 22016: trading; NRW 33001: settlement mint

### 7.4 Nova Swap / DEX

- Swap from verified accounts only in production
- Liquidity provider injection: institutional Tier 4 only

---

## 8. Data protection (GDPR-aligned)

| Principle | Implementation |
|-----------|----------------|
| Lawful basis | Contract + legal obligation (AML) |
| Data minimization | Collect only fields required per tier |
| Right of access | Export via support ticket + `/me` profile |
| Right to erasure | Subject to AML retention overrides |
| Breach notification | 72h to supervisory authority where applicable |
| DPO contact | privacy@anakatech.llc (configure per deployment) |

PIN and passwords: PIN hashed; no password auth (email + PIN only).

---

## 9. Roles & responsibilities

| Role | Responsibility |
|------|----------------|
| **MLRO / Compliance Officer** | SAR filing, policy owner, regulator liaison |
| **Operations** | Admin meta promote, settlement batches, Hybx reconcile |
| **Super Admin** (10 configured) | Platform config; auto `kyc_status = verified` — production must gate super-admin list |
| **Member** | Accurate declarations; report changes within 30 days |

---

## 10. Training & audit

- Annual AML training for all staff with system access
- Quarterly sample review of Tier 3+ transactions
- Annual independent AML audit (or as required by license)
- `audit_logs` table captures user actions for forensic review

---

## 11. API & technical enforcement (roadmap)

| Control | Status |
|---------|--------|
| `users.kyc_status` column | **Live** |
| Expose KYC on `/auth/me` | Planned |
| Block wire/convert if not verified | Planned |
| Block m2 promote if not Tier 2+ | Planned |
| KYC provider webhooks | Planned |
| Member KYC UI wizard | Planned |

---

## 12. Document checklist by tier

### Tier 1
- [ ] Government-issued photo ID (front + back if applicable)
- [ ] Selfie / liveness video

### Tier 2
- [ ] Proof of address (utility bill, bank statement ≤ 90 days)
- [ ] Signed SOF declaration

### Tier 3
- [ ] Bank statements (6 months)
- [ ] Tax returns or audited accounts (entities)
- [ ] Reference letter from licensed bank (optional)

### Tier 4 (institutional)
- [ ] Certificate of incorporation
- [ ] Register of directors / UBOs
- [ ] License copy (if regulated)
- [ ] AML policy summary
- [ ] Signed correspondent agreement

---

## 13. Contact & complaints

| Channel | Address |
|---------|---------|
| Compliance | compliance@anakatech.llc |
| Privacy | privacy@anakatech.llc |
| Support | support via member app |

---

## 14. Legal disclaimer

This document describes the **intended** compliance framework for Nova Bank Online. It does not constitute legal advice. Operators must obtain local legal counsel and appropriate licenses before offering regulated financial services.

---

*Nova Bank Online · KYC-AML-FULL v1.0 · June 2026*

