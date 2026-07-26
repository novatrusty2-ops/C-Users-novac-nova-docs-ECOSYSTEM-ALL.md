# NestJS patch — PouchPay / ALLTRA quote callData

Install into `nova-bank-api` so `POST /api/v1/alltra-chain/markets/quote` returns executable UniswapV2 `callData` instead of empty `path` / virtual-LP-only quotes.

## Install

```bash
# from nova-bank-api repo root
bash /path/to/ecosystem/scripts/install-pouchpay-calldata.sh
```

Or copy `src/*` into the Nest app and import `PouchpayCalldataModule` from `AppModule`.

## Behavior

- When `POUCHPAY_BRIDGE_URL` is set, proxies quote to the pouchpay-bridge (preferred).
- Otherwise builds callData locally against `ALLTRA_RPC` + router `0xEd04…2940` (same logic as `apps/pouchpay-bridge`).

## Env

```
POUCHPAY_BRIDGE_URL=https://<your-pouchpay-bridge>.up.railway.app
ALLTRA_RPC=https://mainnet-rpc.alltra.global
```
