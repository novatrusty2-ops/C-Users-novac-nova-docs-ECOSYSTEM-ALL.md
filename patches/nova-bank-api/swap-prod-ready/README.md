# Swap production-ready patch (HTTP 200 + seed books)

Drop-in NestJS helpers for the private Nova Bank API so production swap matches OpenAPI:

- `POST /swap/quote` → **HTTP 200** (today Railway returns **201**)
- Seed Marionette **mock_fallback** order books for markets listed on `GET /swap/markets` but currently 404:
  `MATIC-USD`, `NOVA-USDC`, `NRW-USDC`, `VICTORYA-USDC`, `ANKA-USDC`, `TRX-USDC`, `ALL-USDC`

## Install

```bash
NOVA_API_ROOT=/path/to/nova/apps/api bash scripts/install-swap-prod-ready.sh
```

Then:

1. Register `SwapProdReadyModule` in `app.module.ts` (installer attempts this).
2. In existing `SwapService` / books `Map`, call `seedMissingMockBooks(books)` from `onModuleInit` (see `src/seed-books.ts`).
3. On quote handler, ensure `@HttpCode(HttpStatus.OK)` **or** rely on `SwapQuoteHttp200Interceptor`.

## Verify after deploy

```bash
npm run verify:swap-prod
# expect: PASSED: all N markets orderbook+quote → HTTP 200
```

## Bridge alternative

If you cannot redeploy NestJS immediately, run [`apps/swap-bridge`](../../../apps/swap-bridge) which normalizes 201→200 and synthesizes missing books at the edge.
