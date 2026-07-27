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

### One-time setup
1. Create a Railway project/service with root directory `apps/boatel`
2. Attach a volume at `/data`
3. Set variables:
   - `NEXTAUTH_SECRET` — long random string
   - `NEXTAUTH_URL` — public HTTPS origin
   - `DATABASE_URL` — `file:/data/boatel.db` (optional; image default)
4. Add GitHub Actions secret `RAILWAY_TOKEN` (Railway project token)

### Deploy now
```bash
export RAILWAY_TOKEN=...
export RAILWAY_SERVICE=boatel
npm run deploy:boatel-railway
```

Or push to `main` under `apps/boatel/**` — workflow `.github/workflows/deploy-boatel.yml` runs automatically when the secret exists.

Health check: `GET /api/health`

## Out of scope (MVP)

- Stripe Connect / real payouts
- Live map provider
- In-app messaging

<!-- deploy kick 2026-07-27T08:54Z -->

<!-- go-live 2026-07-27T09:15Z -->

<!-- go 2026-07-27T09:26Z -->
