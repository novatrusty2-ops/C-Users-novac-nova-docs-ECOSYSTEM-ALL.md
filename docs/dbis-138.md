# DeFi Oracle / DBIS Chain 138

_Source: Nova Bank API public docs · Nova Wallet production · updated 2026-07-20_

# DeFi Oracle Chain 138 (eip155:138)

**Chain ID:** 138 (0x8a)  
**CAIP-2:** `eip155:138`  
**Native token:** ETH  
**Role:** Custody chain (DeFi Oracle / OneX)

## Overview

DeFi Oracle Chain provides institutional custody for ETH and ERC-20 assets on chain 138.
Nova Bank OneX integration syncs deposits into ledger accounts. Nova Wallet reads on-chain
balances via public RPC and Blockscout (Etherscan-compatible) explorer APIs.

> **Not Etherscan.** Chain 138 is **not** indexed by `etherscan.io`. Use the Blockscout
> explorers below. Their `/api` surface matches the Etherscan query shape
> (`module=account&action=…`).

## RPC

- `https://rpc.defi-oracle.io`
- `https://rpc.public-0138.defi-oracle.io` (fallback)

## Explorer (Blockscout)

Primary + companions (aligned across Nova Wallet, Signet, `ECOSYSTEM.json`):

- `https://explorer.defi-oracle.io` (primary)
- `https://explorer.d-bis.org`
- `https://blockscout.defi-oracle.io`

### Etherscan-compatible API

```
GET {explorer}/api?module=account&action=balance&address={addr}&tag=latest
GET {explorer}/api?module=account&action=tokenlist&address={addr}
GET {explorer}/api?module=account&action=txlist&address={addr}&sort=desc
GET {explorer}/api/v2/addresses/{addr}/tokens?type=ERC-20
GET {explorer}/api/v2/addresses/{addr}/transactions
```

Nova Wallet client: `apps/nova/src/lib/explorerApi.ts`

## Tokens / liquidity / value (must not drop)

Custody catalog symbols on `dbis-138` (manifest + wallet import):

`ETH`, `USDC`, `USDT`, `BTC`, `SHIVA`, `ACX`, `ICX`, `XRP`, `E1111`, `AUSDT`,
`VICTORYA`, `KUSD`, `ANAKA`, `CUSDT`, `CUSDC` (+ optional `DFO` alias pricing)

- **Prices:** CoinGecko → oracle (`ORACLE_USD` / `markets.refPriceUsd`) → peg for stables  
- **Liquidity:** mesh books in `apps/nova/src/lib/liquidity.ts` for chain `138`  
- **Balances:** JSON-RPC + Blockscout tokenlist merge (catalog rows kept even at zero)

## DeFi wallet

- `https://wallet.defi-oracle.io/wallet/`

## Ops sync (Python)

```bash
bash scripts/fetch-api.sh
python3 scripts/sync-ecosystem.py
node scripts/verify-ecosystem.mjs
```

`sync-ecosystem.py` probes DBIS RPC + Blockscout explorers, writes
`productionUrls.dbisExplorer` / `dbisExplorerApi`, and **ensures** every required
symbol keeps `dbis-138` in `tradableTokens[].networks` with ref USD prices preserved.

## External withdraw + charts

- Nova Wallet **Withdraw** (`/withdraw`) sends tradable/transferable stables (USDC/USDT/…)
  and ETH to external EVM addresses on DeFi Oracle (138), NovaONE, NRW, Ethereum, or BSC.
- Production signing uses injected Web3 or unlocked keystore; Activity records `kind: withdraw`.
- Token + portfolio charts: `apps/nova/src/lib/charts.ts` (mesh mid + liquidity volume).

## Web3 connect (production)

Nova Wallet + Signet call EIP-3326 / EIP-3085 on connect and network switch:

```
wallet_switchEthereumChain { chainId: "0x8a" }
wallet_addEthereumChain { chainId: "0x8a", chainName: "DeFi Oracle", … }
```

Injected wallets (MetaMask, Trust, SafePal, Gate, …) sign Send via `BrowserProvider`.
Stables are **tradable / transferable / swappable** in `ECOSYSTEM.json` and the wallet catalog;
ERC-20 sends require a discovered or registered contract address.

## Integration

- Nova Bank `onex-wallet.service` — deposit sync
- Nova Wallet — multi-chain balance + explorer activity for chain 138
- Ecosystem tokens tradable on NovaONE + NRW World + DeFi Oracle (138)

## Live links (Nova Wallet + DeFi Oracle)

### Nova Wallet
- https://novablockchain.it.com/token/138/ETH
- https://novablockchain.it.com/token/138/USDT
- https://novablockchain.it.com/withdraw?chainId=138&symbol=USDT
- https://novablockchain.it.com/portfolio

### Explorer / RPC / wallet
- https://explorer.defi-oracle.io
- https://explorer.d-bis.org
- https://blockscout.defi-oracle.io
- https://rpc.defi-oracle.io
- https://wallet.defi-oracle.io/wallet/
