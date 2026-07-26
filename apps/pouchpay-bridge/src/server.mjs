#!/usr/bin/env node
/**
 * PouchPay route bridge — restores missing swap callData.
 *
 * Upstream api.pouchpay.io /v0/quote returns empty path[] and no callData
 * (legacyOnChainSwapRemoved / virtualLpOnly). This service quotes the live
 * UniswapV2 router on Alltra (651940) and returns executable calldata.
 *
 * Endpoints:
 *   GET  /health
 *   GET  /v1/tokens
 *   POST /v0/quote
 *   POST /v1/quote
 *   POST /v1/advanced/routes
 *   POST /api/v1/alltra-chain/markets/quote   (Nova Bank shape)
 *
 * Env:
 *   PORT                      default 4082
 *   ALLTRA_RPC                default https://mainnet-rpc.alltra.global
 *   POUCHPAY_DEFAULT_RECIPIENT  used when body omits recipient
 *   PUBLIC_BASE_URL           optional public origin
 */

import { createServer } from "node:http";
import { buildPouchpayRoute, toAdvancedRoute } from "./calldata.mjs";
import { TOKENS, CHAIN_ID, ROUTER } from "./tokens.mjs";

const PORT = Number(process.env.PORT || 4082);

function resolvePublicBase() {
  const explicit = (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || "").trim().replace(/\/$/, "");
  if (railwayDomain) {
    return railwayDomain.startsWith("http")
      ? railwayDomain
      : `https://${railwayDomain}`;
  }
  return "";
}

const PUBLIC_BASE = resolvePublicBase();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function normalizeBody(raw) {
  if (!raw || !raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
  }
}

async function handleQuote(body) {
  return buildPouchpayRoute(body);
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let path = url.pathname.replace(/\/$/, "") || "/";

  if (req.method === "OPTIONS") return json(res, 204, {});

  if ((path === "/" || path === "/health") && req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "pouchpay-bridge",
      chainId: CHAIN_ID,
      router: ROUTER,
      publicBase: PUBLIC_BASE || null,
      contract: {
        quoteIncludesCallData: true,
        routesIncludeTransactionRequest: true,
        onChainLiquidity: true,
      },
      endpoints: [
        "POST /v0/quote",
        "POST /v1/quote",
        "POST /v1/advanced/routes",
        "POST /api/v1/alltra-chain/markets/quote",
        "GET /v1/tokens",
      ],
    });
  }

  if (path === "/v1/tokens" && req.method === "GET") {
    return json(res, 200, {
      chainId: CHAIN_ID,
      pricingMode: "on-chain-router",
      swapEnabled: true,
      productionReady: true,
      tokens: Object.values(TOKENS).map((t) => ({
        ...t,
        tradable: true,
        swappable: true,
        transferable: true,
        approved: true,
        production: true,
      })),
      skills: [
        {
          key: "global_swap",
          name: "ALLTRA Global Swap",
          endpoint: `${PUBLIC_BASE || ""}/v1/advanced/routes`,
          quoteApi: `${PUBLIC_BASE || ""}/v0/quote`,
        },
      ],
    });
  }

  const quotePaths = new Set([
    "/v0/quote",
    "/v1/quote",
    "/api/v1/alltra-chain/markets/quote",
    "/alltra-chain/markets/quote",
  ]);
  if (quotePaths.has(path) && req.method === "POST") {
    try {
      const body = normalizeBody(await readBody(req));
      const quote = await handleQuote(body);
      return json(res, 200, quote);
    } catch (err) {
      const status = err.status || 500;
      return json(res, status, { message: err.message || String(err), error: "Quote failed", statusCode: status });
    }
  }

  if (path === "/v1/advanced/routes" && req.method === "POST") {
    try {
      const body = normalizeBody(await readBody(req));
      // Accept LiFi-ish nested tokens
      if (body.fromToken?.symbol || body.fromToken?.address) {
        body.fromSymbol = body.fromToken.symbol || body.fromToken.address;
      }
      if (body.toToken?.symbol || body.toToken?.address) {
        body.toSymbol = body.toToken.symbol || body.toToken.address;
      }
      if (body.fromTokenAddress) body.tokenIn = body.fromTokenAddress;
      if (body.toTokenAddress) body.tokenOut = body.toTokenAddress;
      if (body.fromAmount && !body.amount) body.amount = body.fromAmount;
      const quote = await handleQuote(body);
      return json(res, 200, { routes: [toAdvancedRoute(quote)] });
    } catch (err) {
      const status = err.status || 500;
      return json(res, status, { message: err.message || String(err), error: "Route failed", statusCode: status });
    }
  }

  return json(res, 404, { message: `Cannot ${req.method} ${path}`, error: "Not Found", statusCode: 404 });
}

createServer((req, res) => {
  void handle(req, res).catch((err) => {
    json(res, 500, { message: err.message || String(err), statusCode: 500 });
  });
}).listen(PORT, () => {
  console.log(`pouchpay-bridge listening on :${PORT}`);
});
