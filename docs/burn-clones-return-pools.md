# Burn clone tokens → return value to pools (protect real 11:11)

## Intent

- Burn / unwind **clone** inventory: `E1111` (clone of 11:11), **both Zaragoza** (`ZARA`, `ZRG`), `WBNB`, `WTRX`
- Return proceeds into pool-side assets (`AUSDT` / `ALL`)
- **Never** burn or sell real **`11::11`** (also refuses `11:11`, `11;11`, `GLD1111`)

`WETHIR` is not in production PouchPay/Alltra token lists — skipped.

## Dry run

```bash
npm run burn:clones-pools
# or
CLONE_AMOUNT=0.01 POOL_ASSET=AUSDT node scripts/burn-clones-return-to-pools.mjs
```

Uses live `pouchpay-bridge` for on-chain clone→AUSDT `callData`, and Bank `E1111-USDC` for the ledger clone.

## Live

1. On-chain: take printed `transactionRequest` / `callData` and sign from the wallet that holds the clones (approve router first if needed).
2. Ledger `E1111` only:

```bash
SWAP_LIVE=1 CONFIRM_BURN_CLONES=YES NOVA_BANK_TOKEN=… npm run burn:clones-pools
```

## Protected set

`11::11`, `11:11`, `GLD1111`, `ALL`, `WALL`, `AUSDT`, `WETH`, `BTC`, `ETH`, `USDC`, `USDT`, `NOVA`, `NRW`
