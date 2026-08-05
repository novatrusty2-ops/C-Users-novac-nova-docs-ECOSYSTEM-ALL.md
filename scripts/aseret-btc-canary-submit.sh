#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ASERET_BTC_PUBLIC_API_BASE:-https://aseret-btc.d-bis.org/api/v1}"
API_KEY="${ZSTACK_API_KEY:?Set ZSTACK_API_KEY first}"

TXID="${1:?Usage: $0 <txid> <vout> <amount_sats> <block_height> <confirmations> [ledger_reference]}"
VOUT="${2:?Missing vout}"
AMOUNT_SATS="${3:?Missing amount_sats}"
BLOCK_HEIGHT="${4:?Missing block_height}"
CONFIRMATIONS="${5:?Missing confirmations}"
LEDGER_REFERENCE="${6:-nova-canary-001}"

ADDRESS="bc1qh658lxrvwa9yt4me5za62mt73r53zhaq3294q8"
WALLET_ID="HYBX-OFFICE-005"

if [ "$CONFIRMATIONS" -lt 6 ]; then
  echo "Refusing: confirmations must be at least 6"
  exit 1
fi

payload="$(jq -n \
  --arg asset "BTC" \
  --arg network "bitcoin-mainnet" \
  --arg walletId "$WALLET_ID" \
  --arg receivingAddress "$ADDRESS" \
  --arg txid "$TXID" \
  --argjson vout "$VOUT" \
  --argjson amountSats "$AMOUNT_SATS" \
  --argjson blockHeight "$BLOCK_HEIGHT" \
  --argjson confirmations "$CONFIRMATIONS" \
  --arg ledgerReference "$LEDGER_REFERENCE" \
  '{
    asset: $asset,
    network: $network,
    walletId: $walletId,
    receivingAddress: $receivingAddress,
    txid: $txid,
    vout: $vout,
    amountSats: $amountSats,
    blockHeight: $blockHeight,
    confirmations: $confirmations,
    ledgerSync: {
      system: "ZStack",
      status: "posted",
      asset: $asset,
      walletId: $walletId,
      reconciled: true,
      ledgerReference: $ledgerReference
    }
  }'
)"

curl -fsS \
  -X POST "$BASE_URL/aseret/btc/canary-evidence" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  --data "$payload" | jq '.'

echo
echo "Status:"
curl -fsS "$BASE_URL/integrations/btc-ledger" | jq '.canary'
