# All tokens ↔ ETH / BNB / TRX (full production)

On Alltra (651940), **ETH / BNB / TRX** are wrap aliases:

| Native | Wrap | Address |
|--------|------|---------|
| ETH | WETH | `0x798f6762bb40d6801a593459d08f890603d3979c` |
| BNB | WBNB | `0xfE6E0aEd4Ca571BFbF3C3ae7Bf01fcA40B4716d3` (external) |
| TRX | WTRX | `0xaA7d8C0B6119148DE1456EC0025f9A7b2Dd41A4F` (external) |

Liquidity is via the UniswapV2 router `0xEd04ee8307C0656207af5afe3926Ae2380052940`, almost always **TOKEN → WALL → wrap**.

## Surfaces

- **External bridge (production):** https://pouchpay-bridge-production.up.railway.app  
  - `GET /v1/tokens` — full production registry + `nativeAliases`  
  - `POST /v0/quote` — `fromSymbol`/`toSymbol` accept `ETH`/`BNB`/`TRX`  
- **Nova Trade:** `ALLTRA_SWAP_SYMBOLS` includes full set + natives  
- **Nest patch:** `patches/nova-bank-api/pouchpay-calldata` mirrors registry + WALL hop

## Verify

```bash
POUCHPAY_API_BASE=https://pouchpay-bridge-production.up.railway.app \
  node scripts/verify-native-eth-bnb-trx-swaps.mjs

# faster smoke
SAMPLE_ONLY=1 POUCHPAY_API_BASE=https://pouchpay-bridge-production.up.railway.app \
  node scripts/verify-native-eth-bnb-trx-swaps.mjs
```

Protected sell of real `11::11` is skipped (refused) unless `ALLOW_PROTECTED_QUOTES=1`.
