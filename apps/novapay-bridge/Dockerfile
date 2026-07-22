FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
ENV NODE_ENV=production
ENV NOVAPAY_SANDBOX_BASE=https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox
EXPOSE 4080
CMD ["node", "src/server.mjs"]
