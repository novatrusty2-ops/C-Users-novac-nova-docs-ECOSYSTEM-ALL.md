# BTC canary evidence (Aseret / ZStack)

Posts **on-chain canary evidence** to the Aseret BTC ledger API after a canary payment is already confirmed. This flow **does not send BTC**.

## Fixed canary target

| Field | Value |
|-------|--------|
| Wallet | `HYBX-OFFICE-005` |
| Address | `bc1qh658lxrvwa9yt4me5za62mt73r53zhaq3294q8` |
| Network | `bitcoin-mainnet` |
| Min confirmations | `6` |
| Public API base | `https://aseret-btc.d-bis.org/api/v1` |

Status probe (no auth):

```bash
curl -fsS https://aseret-btc.d-bis.org/api/v1/integrations/btc-ledger | jq '.canary'
```

`canary.status` is `missing` until evidence is posted and reconciled.

## Prerequisites

1. Zardasht (or ops) sends BTC to the canary address above.
2. The payment has **≥6 confirmations**.
3. `ZSTACK_API_KEY` is set in the shell (never commit the key).
4. `jq` and `curl` are available.

Optional override:

```bash
export ASERET_BTC_PUBLIC_API_BASE='https://aseret-btc.d-bis.org/api/v1'
```

## Gather tx fields

From mempool.space or Blockstream, for the canary address UTXO:

| Arg | Meaning |
|-----|---------|
| `txid` | Transaction id |
| `vout` | Output index paying the canary address |
| `amount_sats` | Output value in satoshis |
| `block_height` | Including block height |
| `confirmations` | Current confirmations (≥6) |
| `ledger_reference` | Optional; default `nova-canary-001` |

Example lookup:

```bash
ADDR='bc1qh658lxrvwa9yt4me5za62mt73r53zhaq3294q8'
curl -fsS "https://blockstream.info/api/address/${ADDR}/txs" | jq .
```

## Submit evidence

```bash
export ZSTACK_API_KEY='<secure-zstack-api-key>'

bash scripts/aseret-btc-canary-submit.sh \
  '<btc_txid>' \
  0 \
  1000 \
  900001 \
  6 \
  'nova-canary-001'
```

Or via npm (same args after `--`):

```bash
npm run canary:btc-evidence -- \
  '<btc_txid>' \
  0 \
  1000 \
  900001 \
  6 \
  'nova-canary-001'
```

The script:

1. Refuses if `confirmations < 6`
2. `POST /aseret/btc/canary-evidence` with `X-API-Key`
3. Prints `GET /integrations/btc-ledger` → `.canary`

## Verify

Re-check until the canary is reconciled (fields such as `status`, `reconciled`, `confirmations`, `ledgerReference`):

```bash
curl -fsS https://aseret-btc.d-bis.org/api/v1/integrations/btc-ledger | jq '.canary'
```
