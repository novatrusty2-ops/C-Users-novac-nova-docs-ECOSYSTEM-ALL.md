#!/usr/bin/env bash
# Option 3 — migrate bridge relayer from current VPS to a new Hetzner host.
# Requires: SSH to OLD + NEW hosts. Optional: HCLOUD_TOKEN for API checks.
# This agent cannot run the migrate without your keys; run on your PC.
set -euo pipefail

OLD_HOST="${OLD_HOST:-51.75.64.28}"
OLD_USER="${OLD_USER:-root}"
NEW_HOST="${NEW_HOST:-}"
NEW_USER="${NEW_USER:-root}"
RELAYER_PATH="${RELAYER_PATH:-/opt/nova-bridge-adapter}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=accept-new}"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -n "$NEW_HOST" ]] || die "Set NEW_HOST to the Hetzner IPv4, e.g. NEW_HOST=x.x.x.x $0"

echo "==> Preflight SSH"
ssh $SSH_OPTS -o BatchMode=yes -o ConnectTimeout=10 "$OLD_USER@$OLD_HOST" "test -d '$RELAYER_PATH'" \
  || die "Cannot reach old host or missing $RELAYER_PATH"
ssh $SSH_OPTS -o BatchMode=yes -o ConnectTimeout=10 "$NEW_USER@$NEW_HOST" "echo new_ok" \
  || die "Cannot reach new Hetzner host — add your SSH key first"

if [[ -n "${HCLOUD_TOKEN:-}" ]]; then
  echo "==> Optional Hetzner API ping"
  curl -sS -m 15 -H "Authorization: Bearer $HCLOUD_TOKEN" \
    https://api.hetzner.cloud/v1/servers | head -c 200 || true
  echo
fi

echo "==> Bootstrap new host packages"
ssh $SSH_OPTS "$NEW_USER@$NEW_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y rsync curl ca-certificates nginx
fi
mkdir -p /opt
REMOTE

echo "==> Rsync relayer tree OLD -> NEW"
ssh $SSH_OPTS "$OLD_USER@$OLD_HOST" "sudo tar -C / -czf - '${RELAYER_PATH#/}'" \
  | ssh $SSH_OPTS "$NEW_USER@$NEW_HOST" "sudo tar -C / -xzf -"

echo "==> Post-copy checks on NEW"
ssh $SSH_OPTS "$NEW_USER@$NEW_HOST" "ls -la '$RELAYER_PATH' | head -n 20"

cat <<EOF
==> Next (manual — secrets / systemd / DNS are environment-specific)
1. On NEW: install Node/runtime deps used by the adapter; copy .env / keys from OLD securely
2. On NEW: enable systemd (or your process manager) for the bridge adapter
3. Open only required ports in Hetzner Cloud Firewall
4. Point RPC nginx/Bunny origin to NEW if this host also terminates public RPC
5. Verify: curl public eth_blockNumber; exercise one bridge path
6. Update ECOSYSTEM.json deployed.bridgeRelayerVps to $NEW_HOST
7. Drain OLD ($OLD_HOST), then firewall/decommission

Bunny/Cloudflare edge swap is DNS/UI — not automated here.
EOF
