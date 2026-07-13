# Nova Bank & Chains Whitepaper

_Source: Nova Bank API public docs · updated 2026-07-13T10:11:59.844Z_

# Nova Bank & Chains — Unified Whitepaper

**Version:** 2.0 · June 2026  
**Operator:** Anakatech LLC  
**Stack:** Nova Bank Online · Nova Swap · NovaONE · NRW World · DBIS 138 · AnakaChain · Hybx Finance

---

## Executive summary

Nova is a **unified financial and blockchain ecosystem** combining:

1. **Nova Bank Online** — double-entry ledger banking with m0/m1/m2 fiat tiers, SWIFT wires, Visa cards, and Hybx/Fineract institutional settlement  
2. **Nova Swap** — DEX on NovaONE via Marionette GraphQL  
3. **Five core chains** — NovaONE (trading), NRW World (central bank settlement), DBIS 138 (custody), AnakaChain (bridge), ALLTRA (external EVM)  
4. **Partner rails** — Wise, Revolut, Alchemy RPC gateway, Fireblocks/OneX custody targets  

This whitepaper is the **canonical** reference for bank architecture and chain mesh. Companion docs: `docs/PROTOCOL.md`, `docs/compliance/KYC-AML-FULL.md`.

---

## 1. Nova Bank Online — ledger architecture

### 1.1 Protocol modules

| Module | Protocol | SWIFT BIC | IBAN tier | Role |
|--------|----------|-----------|-----------|------|
| **m0** | `online` | NOVAGB2L | NOVA01 | Ledger — funding, inbound staging, online Visa |
| **m1** | `offline` | NOVAEE2L | NOVA02 | Local Ledger — working balance, Hybx receive, exchange, cards |
| **m2** | `meta` | NOVAXX2L | NOVA03 | Meta Fiat — settlement pool; **only tier that exits to real rails** |

### 1.2 Money flow

```
Inbound (wire, Hybx, exchange, sandbox fund)
        │
        ▼
   m1 Local Ledger  ──admin promote──▶  m2 Meta Fiat  ──SWIFT/partner──▶  Real bank account
        ▲
   m0 Ledger (optional staging via ledger-send)
```

### 1.3 Key API surfaces

| Path | Purpose |
|------|---------|
| `POST /auth/start` | Member sign-in (email + 4-digit PIN) |
| `POST /transfers/exchange` | Crypto ↔ fiat conversion |
| `POST /ledger-send/orders` | m0 → m1 |
| `POST /settlement/meta/promote` | Admin: m1 → m2 |
| `POST /ledger-send/convert` | m2 → real bank (SWIFT) |
| `POST /fineract/receive` | Hybx deposit → m1 |
| `POST /settlement/run` | Card/external clearing batches |

**Production API:** `https://nova-bank-api-production-7311.up.railway.app/api/v1`

---

## 2. Hybx Finance (Apache Fineract)

Nova integrates **Hybx** as institutional core banking:

- **API:** `https://fineract.hybxfinance.com/fineract-provider/api/v1`
- **Use cases:** Client savings accounts, inbound receive, OMNL BTC L1 GL journals, settlement middleware

### Settlement routes

| Route ID | Flow |
|----------|------|
| `hybx-real-fiat-bank` | receive → ledger_send → meta_promote → bank_payout |
| `hybx-crypto-vault` | receive → crypto_convert |
| `hybx-web3-wallet` | receive → crypto_convert → web3_withdraw |
| `hybx-buy-crypto` | receive → buy_crypto (Swap) |
| `hybx-fx-hold` | receive → fx_convert |
| `m1-meta-bank` | meta_promote → bank_payout (admin) |

---

## 3. Chain mesh

```
                    ┌──────────────────┐
                    │   Nova Bank API   │
                    │  m0 / m1 / m2     │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │  NovaONE    │    │  NRW World  │    │  DBIS 138   │
  │  Chain      │    │  Central    │    │  DeFi       │
  │  22016      │    │  Bank 33001 │    │  Oracle     │
  │  Trading    │    │  Settlement │    │  Custody    │
  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
         │                  │                   │
         └──────────┬───────┴───────┬───────────┘
                    ▼               ▼
            ┌─────────────┐ ┌─────────────┐
            │ AnakaChain  │ │  ALLTRA     │
            │ Bridge11013 │ │  Mainnet    │
            └─────────────┘ └─────────────┘
```

### 3.1 NovaONE (Chain ID 22016)

| Property | Value |
|----------|-------|
| Role | Trading, Marionette DEX |
| Consensus | Besu QBFT |
| RPC | `https://novablockchain.it.com/novaone-rpc/` |
| Explorer | `https://novaone.novablockchain.it.com` |
| GraphQL | Marionette (DEX pools) |

Native token: **NOVA** — ecosystem mint 100B, tradable on Nova Swap.

### 3.2 NRW World (Chain ID 33001)

| Property | Value |
|----------|-------|
| Role | Central bank settlement chain |
| API | `https://nrw-central-bank-api-production.up.railway.app/api/v1` |
| SWIFT BIC | NRWWORLD1 |

Native token: **NRW** — 100B mint; pairs with USDC on liquidity hub.

### 3.3 DeFi Oracle / DBIS / OneX (Chain ID 138)

| Property | Value |
|----------|-------|
| Role | Primary EVM custody (ETH, ERC-20) |
| RPC | `https://rpc.defi-oracle.io` |
| Explorer | `https://explorer.defi-oracle.io` |
| Wallet | `https://wallet.defi-oracle.io` |
| CAIP-2 | `eip155-138` |

Alchemy gateway: `https://nova-alchemy-api-production.up.railway.app/api/v1`

### 3.4 AnakaChain Bridge (Chain ID 11013)

| Property | Value |
|----------|-------|
| Role | Cross-chain bridge layer |
| RPC | `https://bridge.anakachain.com` |
| Connect API | `https://api-connect.anakachain.com` |
| AnakaBank | `https://anakatech.llc/bank-api` |

### 3.5 ALLTRA Mainnet (Chain ID 651940)

| Property | Value |
|----------|-------|
| Role | External partner EVM |
| RPC | `https://mainnet-rpc.alltra.global` |

---

## 4. Token & mint registry

### 4.1 Production mint targets (ledger + chain)

| Asset | Mint amount | Primary chain |
|-------|-------------|---------------|
| USD, EUR, GBP, AUD, JPY, SDG, NOVA, NRW | 100 billion each | All ecosystem |
| CHF | 200 billion | All ecosystem |
| USDC | 100 billion | EVM + ledger |
| USDT | 500 billion | Multi-network |
| BTC | 1 million | Ledger + OMNL |
| ETH | 10 million | DBIS 138 |

### 4.2 Member ecosystem coins

SHIVA, ACX, ICX, XRP, E1111, AUSDT, VICTORYA, KUSD, ANAKA, CUSDT, CUSDC — each **100B** mint, **100M** m1 LP load, **$1 USD peg** reference.

### 4.3 External networks

| Network | Native | Stablecoins |
|---------|--------|-------------|
| Ethereum | ETH | USDC, USDT ERC-20 |
| Polygon | MATIC | USDC |
| Arbitrum / Base | ETH | USDC (via Alchemy) |
| Solana | SOL | SPL USDC |
| Tron | TRX | USDT TRC-20 |
| BSC | BNB | BEP-20 USDT |

---

## 5. Nova Swap

- **URL:** `/swap` (served with Nova Bank deployment)
- **Engine:** Marionette GraphQL on NovaONE
- **Flows:** Buy/sell ecosystem tokens; LP injection (institutional); cross-chain via `POST /chains/ecosystem/swap`

---

## 6. Payment rails

| Rail | Type | Debit account |
|------|------|---------------|
| SWIFT MT103 + GPI | Wire | m2 Meta Fiat |
| SEPA | EUR outbound | m2 (EUR meta wallet) |
| Wise | Partner API | m2 |
| Revolut B2B | Partner API | m2 |
| Visa pre-auth | Card spend | m1 primary |
| Cash desk | Deposit/withdraw | m1 |
| Trade finance | LC / SBLC / DLC / BG | Credit-reviewed |

---

## 7. OMNL institutional settlement

**OMNL BTC L1** — institutional Bitcoin settlement via Fineract GL:

- GL accounts: 12015 (BTC asset), 2410 (liability), 1410 (clearing), office 3 Hospitallers24
- Nova ledger journal + Fineract dual-leg journal
- On-chain settlement to configured BTC address (separate from ledger booking)

See: `docs/omnl/OMNL_BTC_L1_SETTLEMENT_GL_AND_JOURNAL.md`

---

## 8. Security architecture

| Layer | Control |
|-------|---------|
| Auth | JWT + 4-digit PIN; admin `X-Admin-Key` |
| Idempotency | Required on all mutations |
| Ledger | Double-entry; `ledger-core` engine |
| Cards | Encrypted vault; OTP 5-minute TTL |
| Production guard | `sandboxFund: false`, `ALLOW_SANDBOX_PROVIDERS` configurable |
| Audit | `audit_logs` per user action |
| KYC | `kyc_status` gating (enforcement roadmap) |

---

## 9. Governance

- **10 super admins** — Nova API `SUPER_ADMIN_EMAILS`
- **NRW admin key** — monetary issuance on NRW chain
- **Compliance officer** — SAR, EDD, meta promote approval
- **Protocol version** — Nova Sync v1 (legacy 101.1 accepted on read)

---

## 10. Production URL map

| Service | URL |
|---------|-----|
| Nova Bank | https://nova-bank-api-production-7311.up.railway.app |
| Nova Alchemy | https://nova-alchemy-api-production.up.railway.app |
| NRW Central Bank | https://nrw-central-bank-api-production.up.railway.app |
| Hybx Fineract | https://fineract.hybxfinance.com |
| NovaONE RPC | https://novablockchain.it.com/novaone-rpc/ |
| DBIS RPC | https://rpc.defi-oracle.io |
| API docs | `/api/v1/docs` |

---

## 11. Wallet ecosystem API

```
GET /api/v1/wallet-ecosystem/networks
GET /api/v1/wallet-ecosystem/tokens
GET /api/v1/wallet-ecosystem/portfolio/:address
GET /api/v1/chains/ecosystem/status
POST /api/v1/chains/ecosystem/swap
```

Mobile target: `@nova/wallet` (Binance-style portfolio + swap).

---

## 12. Legal disclaimer

This whitepaper describes **technical architecture** for the Anakatech / Nova / NRW production stack. It is **not** investment advice, an offer of securities, or a banking license application. Regional compliance, licensing, and KYC/AML are the **operator's responsibility**. See `docs/compliance/KYC-AML-FULL.md`.

---

## 13. Document index

| Document | Path |
|----------|------|
| Protocol spec | `docs/PROTOCOL.md` |
| KYC / AML full | `docs/compliance/KYC-AML-FULL.md` |
| Privacy & Terms | `docs/compliance/PRIVACY-AND-TERMS.md` |
| Ecosystem overview | `docs/whitepapers/ecosystem-whitepaper.md` |
| NovaONE detail | `docs/whitepapers/nova-one-whitepaper.md` |
| NRW World detail | `docs/whitepapers/nrw-world-whitepaper.md` |
| DBIS 138 | `docs/whitepapers/dbis-138.md` |
| AnakaChain | `docs/whitepapers/anakachain.md` |

---

*Nova Bank & Chains Whitepaper v2.0 · Anakatech LLC · June 2026*

