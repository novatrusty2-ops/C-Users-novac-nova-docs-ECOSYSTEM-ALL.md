#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:${DATA_DIR}/boatel.db"
fi

if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  echo "ERROR: NEXTAUTH_SECRET is required" >&2
  exit 1
fi

if [ -z "${NEXTAUTH_URL:-}" ]; then
  echo "WARN: NEXTAUTH_URL not set; auth callbacks may fail" >&2
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  COUNT="$(node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.listing.count().then(c=>{console.log(c); return p.\$disconnect();}).catch(e=>{console.error(e); process.exit(1);})")"
  if [ "$COUNT" = "0" ]; then
    echo "No listings found — seeding demo data..."
    npx tsx prisma/seed.ts || true
  else
    echo "Found $COUNT listings — skip seed"
  fi
fi

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT
export HOSTNAME

if [ -f "./server.js" ]; then
  exec node ./server.js
fi

if [ -f "./apps/boatel/server.js" ]; then
  cd ./apps/boatel
  exec node ./server.js
fi

exec npx next start -H "$HOSTNAME" -p "$PORT"
