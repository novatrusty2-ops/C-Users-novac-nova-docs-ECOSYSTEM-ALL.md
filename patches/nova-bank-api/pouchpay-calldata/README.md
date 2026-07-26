# NestJS patch — PouchPay / ALLTRA quote callData

Install into `nova-bank-api` (or the `nova-bank-wallet` / `api.pouchpay.io` host) so quotes return executable UniswapV2 `path` + `callData` + `transactionRequest` instead of empty `path` / virtual-LP-only responses.

**No bridge required.** The patch embeds the same on-chain builder as `apps/pouchpay-bridge`.

## Install

```bash
# from this ecosystem repo
bash scripts/install-pouchpay-calldata.sh /path/to/nova-bank-api
```

Or copy `src/*` into the Nest app and import `PouchpayCalldataModule` from `AppModule`.

## Endpoints

| Controller | Path (Bank prefix `api/v1`) | Path (wallet, no prefix) |
|------------|-----------------------------|---------------------------|
| markets quote | `POST /api/v1/alltra-chain/markets/quote` | — |
| PouchPay quote | `POST /api/v1/v0/quote` | `POST /v0/quote` |
| PouchPay routes | `POST /api/v1/v1/advanced/routes` | `POST /v1/advanced/routes` |

Always **HTTP 200** with `callData` when liquidity exists.

For `api.pouchpay.io` style hosts, register the module **without** a global `api/v1` prefix (or exclude `PouchpayRoutesController` paths from the prefix) so `/v0/quote` and `/v1/advanced/routes` match mobile.

## Behavior

1. If `POUCHPAY_BRIDGE_URL` is set → proxy to bridge; fall back to embedded builder if bridge omits callData.
2. Otherwise → build callData locally against `ALLTRA_RPC` + router `0xEd04…2940`.

## Env

```
ALLTRA_RPC=https://mainnet-rpc.alltra.global
POUCHPAY_DEFAULT_RECIPIENT=0x5227115Ba7c8694218f570c1EC2a680095872820
# optional
POUCHPAY_BRIDGE_URL=https://<your-pouchpay-bridge>.up.railway.app
```

## Version stamp

Responses include `appVersion: "1.9.5"`, `versionCode: 31` (PouchPay mobile parity).
