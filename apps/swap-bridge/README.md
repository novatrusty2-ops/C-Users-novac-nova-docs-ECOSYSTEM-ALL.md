# Nova Swap Bridge

Railway-ready proxy in front of Nova Bank production swap API.

## Guarantees

| Endpoint | Bridge behavior |
|----------|-----------------|
| `POST /swap/quote` | Always **HTTP 200** on success (normalizes upstream 201) |
| `GET /swap/orderbook` | **HTTP 200** for every listed market (synthetic mock book if upstream 404) |
| `GET /swap/markets` | **HTTP 200** + `quoteReady: true` / `bookSource` |
| `POST /swap/execute` | Proxied as-is (real fills only; OpenAPI 201) |

## Run

```bash
npm run start -w swap-bridge
# http://localhost:4081/health
# http://localhost:4081/swap/markets
```

## Env

- `NOVA_BANK_API_BASE` — default production `/api/v1`
- `PORT` — default `4081`
- `PUBLIC_BASE_URL` — optional public origin

## Verify all markets → 200

```bash
SWAP_API_BASE=http://127.0.0.1:4081 npm run verify:swap-prod
```
