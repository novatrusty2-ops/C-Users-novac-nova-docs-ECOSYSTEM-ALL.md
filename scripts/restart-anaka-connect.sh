#!/usr/bin/env bash
# Attempt Anaka Connect (novaBankVPS) recovery on 51.75.64.28
# Requires working SSH. If SSH kex resets, use OVH KVM — see docs/anaka-connect-vps.md
set -euo pipefail

HOST="${ANAKA_CONNECT_HOST:-51.75.64.28}"
USER_NAME="${ANAKA_CONNECT_SSH_USER:-root}"
PORT="${ANAKA_CONNECT_SSH_PORT:-22}"
KEY="${ANAKA_CONNECT_SSH_KEY:-}"

echo "== Probe $HOST =="
for p in 22 2222 80 3100 3000 28545; do
  if timeout 2 bash -c "echo >/dev/tcp/$HOST/$p" 2>/dev/null; then
    echo "TCP open  :$p"
  else
    echo "TCP fail  :$p"
  fi
done

echo
echo "== HTTP health (expect 200 after restart; reset means app down) =="
for url in \
  "http://$HOST/health" \
  "http://$HOST:3100/health" \
  "http://$HOST:3000/health"
do
  code=$(curl -sS -o /dev/null -w "%{http_code}" -m 8 "$url" 2>/dev/null || echo "ERR")
  echo "$code  $url"
done

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=accept-new -p "$PORT")
if [[ -n "$KEY" ]]; then
  SSH_OPTS+=(-i "$KEY")
fi

echo
echo "== SSH restart as ${USER_NAME}@${HOST}:${PORT} =="
if ! ssh "${SSH_OPTS[@]}" "${USER_NAME}@${HOST}" 'echo connected; hostname' 2>/tmp/anaka-ssh.err; then
  echo "SSH FAILED — cannot restart from this environment."
  cat /tmp/anaka-ssh.err >&2 || true
  cat <<EOF

SSH is unavailable (often kex reset while TCP :22 is open).

Use OVH Manager → VPS vps-58bb86af → Console/KVM and paste the
recovery block in docs/anaka-connect-vps.md

Or provide working credentials and re-run:
  export ANAKA_CONNECT_SSH_USER=...
  export ANAKA_CONNECT_SSH_KEY=/path/to/private_key
  export ANAKA_CONNECT_SSH_PORT=22   # or 2222
  bash scripts/restart-anaka-connect.sh
EOF
  exit 3
fi

ssh "${SSH_OPTS[@]}" "${USER_NAME}@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
echo "Remote host: $(hostname)"
ss -lntp 2>/dev/null | egrep '3100|3000|:80|:443' || netstat -lntp 2>/dev/null | head || true
systemctl list-units --type=service --state=running 2>/dev/null | egrep -i 'anaka|nova|connect|bridge|pm2|nginx|caddy' || true
pm2 list 2>/dev/null || true
ls -la /opt/nova-bridge-adapter /opt/anaka* /srv/anaka* 2>/dev/null || true

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || true
fi
if systemctl list-unit-files 2>/dev/null | egrep -qi 'anaka|nova-bridge|nova-connect'; then
  systemctl restart anaka-connect 2>/dev/null || \
  systemctl restart nova-bridge 2>/dev/null || \
  systemctl restart nova-connect 2>/dev/null || true
fi
if [[ -d /opt/nova-bridge-adapter ]]; then
  cd /opt/nova-bridge-adapter
  docker compose ps 2>/dev/null || true
  docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || true
fi
systemctl restart nginx 2>/dev/null || systemctl restart caddy 2>/dev/null || true

sleep 2
curl -sS -m 5 -o /dev/null -w "local3100=%{http_code}\n" http://127.0.0.1:3100/health || true
curl -sS -m 5 -o /dev/null -w "local80=%{http_code}\n" http://127.0.0.1/health || true
REMOTE

echo
echo "== External verify =="
for url in "http://$HOST:3100/health" "http://$HOST/health"; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "ERR")
  echo "$code  $url"
done

echo "Done. Expect HTTP 200 on health endpoints."
