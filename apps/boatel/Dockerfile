# Boatel MVP — production image (build context: apps/boatel)
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json ./
RUN npm install --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./prisma/build.db"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npx prisma generate \
  && npx prisma migrate deploy \
  && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl wget
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/data
ENV DATABASE_URL="file:/data/boatel.db"

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /data \
  && chown -R nextjs:nodejs /data

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# If standalone nested under apps/boatel (workspace builds), mirror static/public
RUN if [ -d ./apps/boatel ]; then \
      mkdir -p ./apps/boatel/.next ./apps/boatel/public ./apps/boatel/prisma; \
      cp -a ./.next/static ./apps/boatel/.next/static; \
      cp -a ./public/. ./apps/boatel/public/; \
      cp -a ./prisma/. ./apps/boatel/prisma/; \
    fi \
  && chmod +x ./docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
