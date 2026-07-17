# Ecosystem Whitepaper

_Source: Nova Bank API public docs · updated 2026-07-13T10:11:59.153Z_

# Nova–NRW Ecosystem Whitepaper

## Vision

A unified financial stack: **Nova Bank Online** (custodial banking), **Nova Swap** (DEX), **NovaONE** (22016) and **NRW World** (33001) chains, **DBIS 138** (custody), **AnakaChain Bridge** (11013), plus **Tron**, **Solana**, **Ethereum**, **BSC**, and **Polygon** for decentralized asset reach.

## Ecosystem map

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Nova Bank  │────▶│  Nova Swap   │────▶│  NovaONE 22016  │
│  (m0/m1)    │     │  Marionette  │     │  Trading chain  │
└──────┬──────┘     └──────┬───────┘     └────────┬────────┘
       │                   │                       │
       │            ┌──────▼───────┐               │
       └───────────▶│ NRW Central  │◀──────────────┘
                    │ Bank 33001   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         DBIS 138    AnakaChain    Tron/Solana
         custody      bridge       external nets
```

## Token registry

All tokens are **swappable**, **tradable**, **transferable**, and marked **decentralized** in the canonical catalog (`ecosystem-tokens.ts`).

| Category | Symbols | Chains |
|----------|---------|--------|
| Native | NOVA, NRW | nova-one, nrw-world |
| Fiat | USD, EUR, GBP, AUD, CHF, JPY, SDG | All ecosystem chains |
| Stable | USDC, USDT | EVM + Tron + Solana |
| Crypto | ETH, BTC, SOL, TRX, BNB, MATIC | Multi-network |

### Production mint (locked liquidity)

| Token | Amount |
|-------|--------|
| AUD, EUR, GBP, JPY, NOVA, NRW, SDG, USD, USDC | 100 billion each |
| CHF | 200 billion |
| BTC | 1 million |
| ETH | 10 million |
| USDT | 500 billion |

Mint → allocate (Nova Bank fiat) → lock (crypto escrow + fiat nostro) → load LP to both chains.

## Nova Wallet

Binance-style mobile app (`@nova/wallet`):

- **Home** — portfolio, chain status, quick actions  
- **Markets** — NovaONE + NRW tickers  
- **Swap** — Nova Swap integration  
- **Assets** — full minted token catalog + networks  

API: `GET /api/v1/wallet-ecosystem/tokens|networks|portfolio/:address`

## Cross-chain trading

- `POST /chains/ecosystem/swap` — unified execution  
- Market symbols: `USDCNOVA`, `USDCNRW`, fiat pairs, `SOLUSDC`, `TRXUSDC`  
- Liquidity hub aggregates Marionette pools + NRW escrow  

## Governance & compliance

- 10 super admins (Nova API)  
- NRW admin key for monetary issuance  
- Sandbox disabled in production (`sandboxFund: false`)  
- SWIFT MT103/MT102 wire module (NRW)  

## External networks

| Network | Kind | Native | Swap |
|---------|------|--------|------|
| Tron | tron | TRX | USDT_TRC20 |
| Solana | solana | SOL | SPL USDC |
| Ethereum | evm | ETH | ERC-20 |
| BSC | evm | BNB | BEP-20 |
| Polygon | evm | MATIC | ERC-20 |

Ledger vault types in Nova Bank mirror these assets; on-chain connectors expand per provider (Fireblocks, OneX custody on DBIS 138).

## Activation

```powershell
# NRW mint + lock + LP
cd nrw-nova-world && npm run mint:ecosystem

# Nova Wallet
cd nova/apps/wallet && npm start
```

## Legal

This document describes technical architecture for the Anakatech/Nova/NRW production stack. Not investment advice. Regional compliance is the operator's responsibility.

---

*Ecosystem version 1.0 · June 2026*

