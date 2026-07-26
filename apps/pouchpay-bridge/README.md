# PouchPay route bridge

Restores **missing swap `callData`** for PouchPay / ALLTRA Global Swap (chain `651940`).

## Problem

Production `POST https://api.pouchpay.io/v0/quote` (and Nova Bank `POST /api/v1/alltra-chain/markets/quote`) returns:

- `path: []`
- no `callData` / `transactionRequest`
- `legacyOnChainSwapRemoved: true`, `virtualLpOnly: true`

`POST /v1/advanced/routes` also drops the destination token (ALL→ALL) and omits step calldata. PouchPay wallets cannot sign an on-chain swap without call data.

## Fix

This bridge quotes the live Uniswap V2 router `0xEd04ee8307C0656207af5afe3926Ae2380052940` via `getAmountsOut` and encodes:

| Direction | Method |
|-----------|--------|
| ALL → token | `swapExactETHForTokens` (WALL hop) |
| token → ALL | `swapExactTokensForETH` |
| token → token | `swapExactTokensForTokens` |

Responses always include `path`, `callData`, and `transactionRequest`.

## Run

```bash
PORT=4082 npm run start -w pouchpay-bridge
curl -sS -X POST http://127.0.0.1:4082/v0/quote \
  -H 'Content-Type: application/json' \
  -d '{"fromSymbol":"ALL","toSymbol":"AUSDT","amount":"0.01","recipient":"0x5227115Ba7c8694218f570c1EC2a680095872820"}'
```

## Verify

```bash
npm run test:pouchpay-bridge
npm run verify:pouchpay-routes   # against local bridge or POUCHPAY_API_BASE
```

## Deploy

Railway: set root to `apps/pouchpay-bridge`, generate domain, optionally set `VITE_POUCHPAY_API_BASE` on Nova Wallet to the bridge URL.

For Nova Bank / `api.pouchpay.io` without a separate bridge service, install the embedded Nest patch instead:

```bash
bash scripts/install-pouchpay-calldata.sh /path/to/nova-bank-api
```

Version stamp: `appVersion` **1.9.5**, `versionCode` **31**.
