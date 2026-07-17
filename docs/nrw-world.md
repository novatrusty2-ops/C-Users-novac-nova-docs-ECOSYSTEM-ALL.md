# NRW World Central Bank (33001)

_Source: Nova Bank API public docs · updated 2026-07-13T10:11:59.431Z_

# NRW World Chain Whitepaper

**Chain ID:** 33001 (0x8109)  
**Native asset:** NRW  
**Role:** Settlement and central-bank ledger chain for NRW Nova World

## Abstract

NRW World Chain is the on-chain settlement layer for the NRW Nova World virtual central bank. It pairs with NovaONE (22016) for cross-chain trading, holds locked liquidity in chain escrow, and settles RTGS instructions between Nova Bank, AnakaBank, and chain participants.

## Architecture

- **Node:** Ganache-compatible JSON-RPC (production Railway deploy)
- **Central bank API:** Double-entry ledger (reserve pool, chain escrow, locked liquidity)
- **Markets:** Binance-style order book simulation backed by escrow balances
- **Bridge:** Nova Bank → NRW `load-lp` and `receive-from-nova` endpoints

## Token economics

| Asset | Mint target | Pool |
|-------|-------------|------|
| NRW | 100B | Native settlement unit |
| Fiat (7) | 100B–200B each | Reserve pool → Nova Bank nostro → locked |
| USDC/USDT | 100B / 500B | Chain escrow (locked LP) |
| ETH/BTC | 10M / 1M | Chain escrow (locked LP) |

Bootstrap mint runs on API startup; admin `POST /pool/mint` for additional issuance. Liquidity lock prevents recall—stable peg for traders.

## Participants

- NOVA-BANK — liquidity source  
- NRW-WORLD — chain operator  
- NOVA-ONE — cross-chain peer  
- DBIS-138, ANAKA-BRIDGE — extended settlement  

## Security

- `X-NRW-Admin-Key` for mint/lock operations  
- `X-NRW-Participant-Key` for RTGS and LP load  
- Production guard: `NRW_PRODUCTION`, `NRW_LIVE_ACTIVE`  
- Throttler on public endpoints  

## Nova Wallet integration

Same HD wallet address works on NRW World for NRW native transfers; ecosystem tab shows all minted supplies; swap routes to Nova Swap for cross-chain execution.

---

*NRW Nova World Central Bank · BIC NRWWORLD1 · Production 2026*

