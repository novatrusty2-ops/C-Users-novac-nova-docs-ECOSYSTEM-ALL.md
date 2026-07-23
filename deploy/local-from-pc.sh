#!/usr/bin/env bash
# Option 4 — run / verify Nova edge pieces from your PC (LAN validators + local relayer path).
# Does not replace Railway APIs. Adjust LOCAL_* paths to your machine layout.
set -euo pipefail

LAN_RPC="${LAN_RPC:-http://192.168.1.50:8551}"
PUBLIC_RPC="${PUBLIC_RPC:-https://anakatech.llc/novaone-rpc/}"
LOCAL_RELAYER_DIR="${LOCAL_RELAYER_DIR:-$HOME/nova-bridge-adapter}"
RELAYER_REMOTE="${RELAYER_REMOTE:-root@51.75.64.28:/opt/nova-bridge-adapter}"

rpc_call() {
  local url="$1"
  curl -sS -m 10 -X POST "$url" \
    -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' || echo "(unreachable)"
}

echo "==> LAN validator RPC ($LAN_RPC)"
rpc_call "$LAN_RPC"
echo

echo "==> Public RPC ($PUBLIC_RPC)"
rpc_call "$PUBLIC_RPC"
echo

echo "==> Sync relayer tree to PC (read-only copy for local work)"
if [[ "${SYNC_RELAYER:-0}" == "1" ]]; then
  mkdir -p "$LOCAL_RELAYER_DIR"
  rsync -az --info=stats2 -e "ssh -o StrictHostKeyChecking=accept-new" \
    "$RELAYER_REMOTE/" "$LOCAL_RELAYER_DIR/"
  echo "Synced to $LOCAL_RELAYER_DIR"
else
  echo "Skipped rsync. To pull adapter code:"
  echo "  SYNC_RELAYER=1 LOCAL_RELAYER_DIR=$LOCAL_RELAYER_DIR $0"
fi

echo "==> Local run hints"
cat <<EOF
- Validators stay on LAN (192.168.1.50:8551–8554). Do not expose them publicly from your PC.
- Public path stays Cloudflare → nginx → socat → node1 until you cut over.
- Railway APIs stay remote (*.up.railway.app).
- To run the adapter locally after sync:
    cd "$LOCAL_RELAYER_DIR"
    # install deps / copy .env as you do in production, then start the process
- Prefer local RPC URL $LAN_RPC for development; use $PUBLIC_RPC only for integration checks.
EOF
