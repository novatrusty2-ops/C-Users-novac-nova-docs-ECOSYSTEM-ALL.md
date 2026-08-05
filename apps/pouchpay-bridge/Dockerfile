FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
ENV NODE_ENV=production
ENV ALLTRA_RPC=https://mainnet-rpc.alltra.global
EXPOSE 4082
CMD ["node", "src/server.mjs"]
