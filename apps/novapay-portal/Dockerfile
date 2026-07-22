# NovaPay sandbox portal — static SPA for Railway
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_NOVAPAY_SANDBOX_BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox
ENV VITE_NOVAPAY_SANDBOX_BASE=$VITE_NOVAPAY_SANDBOX_BASE

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
