#!/usr/bin/env bash
# Option 2 — run on your PC against the current OVH-class VPS + public RPC.
# Does not migrate providers; verifies current stack and prints cutover steps.
set -euo pipefail

RELAYER_HOST="${RELAYER_HOST:-51.75.64.28}"
RELAYER_USER="${RELAYER_USER:-root}"
RELAYER_PATH="${RELAYER_PATH:-/opt/nova-bridge-adapter}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"
RPC_PATH_URL="${RPC_PATH_URL:-https://anakatech.llc/novaone-rpc/}"
RPC_SUBDOMAIN_URL="${RPC_SUBDOMAIN_URL:-https://novaone-rpc.anakatech.llc}"

rpc_call() {
  local url="$1"
  curl -sS -m 15 -X POST "$url" \
    -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' || true
}

echo "==> (1/4) Public RPC health"
echo "--- path URL: $RPC_PATH_URL"
rpc_call "$RPC_PATH_URL"
echo
echo "--- subdomain: $RPC_SUBDOMAIN_URL"
rpc_call "$RPC_SUBDOMAIN_URL"
echo

echo "==> (2/4) SSH reachability to relayer ($RELAYER_USER@$RELAYER_HOST)"
if ssh $SSH_OPTS -o BatchMode=yes -o ConnectTimeout=10 \
  "$RELAYER_USER@$RELAYER_HOST" "test -d '$RELAYER_PATH' && echo OK_PATH || echo MISSING_PATH; hostname; uptime"; then
  echo "SSH OK"
else
  echo "SSH FAILED — set RELAYER_USER / add your key, then retry:"
  echo "  RELAYER_USER=ubuntu ./deploy/cutover-from-pc.sh"
  exit 1
fi

echo "==> (3/4) Relayer process snapshot"
ssh $SSH_OPTS "$RELAYER_USER@$RELAYER_HOST" \
  "ls -la '$RELAYER_PATH' | head -n 30; (systemctl is-active nova-bridge-adapter 2>/dev/null || true); (pgrep -af bridge || true) | head -n 10"

echo "==> (4/4) Manual cutover checklist (print-only)"
cat <<'EOF'
1. Lower DNS TTL for novaone-rpc.anakatech.llc and anakatech.llc
2. Keep https://anakatech.llc/novaone-rpc/ live during any origin change
3. To move edge off Cloudflare: point origin to new nginx/Caddy (or Bunny pull zone)
4. To move relayer: rsync /opt/nova-bridge-adapter to new host, start service, open firewall ports only
5. Verify eth_blockNumber on path + subdomain URLs
6. Update ECOSYSTEM.json deployed.bridgeRelayerVps to the new IP
7. Firewall or decommission 51.75.64.28 after traffic drains

For full Hetzner migrate, use: ./deploy/hetzner-migrate.sh
For local PC runbook: ./deploy/local-from-pc.sh
EOF
