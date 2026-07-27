# Boatel MVP

Marketplace MVP for floating stays — boatels, yacht suites, and harbour cabins. Inspired by the boatel.world product shape; built as a Next.js app in this monorepo.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Auth.js (NextAuth) credentials
- Prisma + SQLite
- Mock booking confirmation (no Stripe charges yet)

## Setup

From the repo root:

```bash
npm install
npm run db:boatel:migrate -- --name init
npm run db:boatel:seed
npm run dev:boatel
```

Or from `apps/boatel`:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Host  | host@boatel.local   | password123 |
| Guest | guest@boatel.local  | password123 |

## Routes

- `/` — landing
- `/explore` — search listings
- `/listings/[id]` — detail + book
- `/list-your-boat` — host create flow
- `/dashboard` — listings, trips, incoming bookings
- `/auth/signin`, `/auth/signup`

## Env

Copy `.env.example` to `.env` if needed:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
```

## Deploy (Railway)

```bash
export RAILWAY_TOKEN=...          # Project → Settings → Tokens
export RAILWAY_SERVICE=boatel     # optional
bash scripts/deploy-boatel-railway.sh
# or: npm run deploy:boatel-railway
```

Set Railway variables:

- `NEXTAUTH_SECRET` — long random string
- `NEXTAUTH_URL` — public HTTPS origin (e.g. `https://boatel-xxx.up.railway.app`)
- `DATABASE_URL` — `file:/data/boatel.db` (default in image)
- Attach a **volume at `/data`** so SQLite persists across deploys

Health check: `GET /api/health`

## Out of scope (MVP)

- Stripe Connect / real payouts
- Live map provider
- In-app messaging
