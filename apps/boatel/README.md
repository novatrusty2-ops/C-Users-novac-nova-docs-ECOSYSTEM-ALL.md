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

## Out of scope (MVP)

- Stripe Connect / real payouts
- Live map provider
- In-app messaging
