# NovaONE Chain (22016)

_Source: Nova Bank API public docs · updated 2026-07-13T10:11:59.291Z_

# NovaONE Chain Whitepaper

**Chain ID:** 22016 (0x5600)  
**Native asset:** NOVA  
**Role:** Primary trading and settlement layer for the Nova–NRW ecosystem

## Abstract

NovaONE is a zero-gas, public EVM-compatible chain purpose-built for high-throughput trading, cross-chain settlement with NRW World Chain (33001), and integration with Nova Bank Online, Nova Swap (Marionette DEX), DBIS Chain 138 custody, and AnakaChain Bridge.

## Architecture

- **Consensus:** QBFT private mesh with public RPC gateways
- **Gas:** Zero native gas for ecosystem participants (sponsored transactions)
- **Interop:** Cross-chain swaps via unified liquidity hub; NRW Central Bank RTGS bridge
- **Tokens:** NOVA native; USDC, USDT, ETH, BTC; fiat ledger tokens (USD, EUR, GBP, AUD, CHF, JPY, SDG)

## Token economics

| Asset | Mint target | Utility |
|-------|-------------|---------|
| NOVA | 100B | Native gasless settlement, DEX base pair |
| USDC/USDT | 100B / 500B | Stable liquidity, cross-chain peg |
| ETH/BTC | 10M / 1M | Reserve crypto pairs |

Liquidity is loaded from Nova Bank, locked in Marionette order books and NRW escrow pools for price stability.

## Security

- Production RPC: `https://novablockchain.it.com/novaone-rpc/`
- Nova Bank API integration with participant keys
- Super-admin governance (10 operators)
- Marionette execute mode with idempotent settlement

## Nova Wallet integration

Nova Wallet (mobile) connects to NovaONE for balances, send/receive, markets, and deep-links to Nova Swap for execution.

## Roadmap

1. On-chain ERC-20 wrappers for all ecosystem mints  
2. ZK bridge proofs to NRW World and DBIS 138  
3. Institutional API for market makers  

---

*Anakatech LLC · Nova Bank Online · Production 2026*

