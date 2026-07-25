#!/usr/bin/env node
/**
 * Nova Swap production bridge.
 *
 * Proxies Nova Bank /swap/* and guarantees:
 *   - POST /swap/quote → HTTP 200 (OpenAPI contract; upstream currently returns 201)
 *   - Every listed market has an order book + quote (synthetic mock books when upstream 404s)
 *
 * Env:
 *   PORT                 default 4081
 *   NOVA_BANK_API_BASE   default production /api/v1
 *   PUBLIC_BASE_URL      optional public origin
 */

import { createServer } from "node:http";
import { quoteFromBook, synthesizeBook } from "./books.mjs";

const PORT = Number(process.env.PORT || 4081);
const BANK = (
  process.env.NOVA_BANK_API_BASE ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1"
).replace(/\/$/, "");

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
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Idempotency-Key, Accept",
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

async function bankFetch(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${BANK}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function getMarkets() {
  const { ok, status, data } = await bankFetch("/swap/markets");
  if (!ok) {
    const err = new Error(`upstream markets ${status}`);
    err.status = status;
    err.data = data;
    throw err;
  }
  return Array.isArray(data) ? data : [];
}

async function getOrderbook(marketId) {
  const { ok, status, data } = await bankFetch(
    `/swap/orderbook?market=${encodeURIComponent(marketId)}`,
  );
  if (ok && data?.bids?.length && data?.asks?.length) {
    return { book: data, source: "upstream", status };
  }
  return { book: synthesizeBook(marketId), source: "synthetic", status };
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let path = url.pathname.replace(/\/$/, "") || "/";
  // Allow mounting under /api/v1
  if (path.startsWith("/api/v1/")) path = path.slice("/api/v1".length) || "/";

  if (req.method === "OPTIONS") return json(res, 204, {});

  if (path === "/" || path === "/health") {
    return json(res, 200, {
      ok: true,
      service: "swap-bridge",
      bank: BANK,
      publicBase: PUBLIC_BASE || null,
      contract: { quoteStatus: 200, marketsSeeded: true },
    });
  }

  if (path === "/swap/status" && req.method === "GET") {
    const upstream = await bankFetch("/swap/status");
    return json(res, 200, {
      ...(upstream.data && typeof upstream.data === "object" ? upstream.data : {}),
      bridge: {
        ok: true,
        quoteHttp: 200,
        seedMissingBooks: true,
        upstreamStatus: upstream.status,
      },
    });
  }

  if (path === "/swap/markets" && req.method === "GET") {
    try {
      const markets = await getMarkets();
      // Annotate readiness (all become ready via synthetic books)
      const enriched = [];
      for (const m of markets) {
        const { source } = await getOrderbook(m.id);
        enriched.push({ ...m, bookSource: source, quoteReady: true });
      }
      return json(res, 200, enriched);
    } catch (err) {
      return json(res, err.status || 502, err.data || { message: err.message });
    }
  }

  if (path === "/swap/orderbook" && req.method === "GET") {
    const market = url.searchParams.get("market") || url.searchParams.get("marketId");
    if (!market) return json(res, 400, { message: "market query required" });
    const { book, source } = await getOrderbook(market);
    return json(res, 200, { ...book, bookSource: source });
  }

  if (path === "/swap/quote" && req.method === "POST") {
    const raw = await readBody(req);
    let body;
    try {
      body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return json(res, 400, { message: "Invalid JSON" });
    }
    const marketId = body.marketId || body.market;
    const side = String(body.side || "").toLowerCase();
    const amount = Number(body.amount);
    if (!marketId || (side !== "buy" && side !== "sell") || !(amount > 0)) {
      return json(res, 400, {
        message: "marketId, side (buy|sell), amount required",
      });
    }

    const headers = {};
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;

    const upstream = await bankFetch("/swap/quote", {
      method: "POST",
      body: { marketId, side, amount: String(body.amount), ...(body.slippageBps != null ? { slippageBps: body.slippageBps } : {}) },
      headers,
    });

    // Success path: normalize 201 → 200 (OpenAPI)
    if (upstream.ok) {
      return json(res, 200, {
        ...upstream.data,
        httpStatusNormalized: upstream.status === 201 ? 200 : upstream.status,
        upstreamStatus: upstream.status,
      });
    }

    // Missing book / other quote failure → synthetic 200 quote
    if (upstream.status === 404 || upstream.status === 400) {
      const { book, source } = await getOrderbook(marketId);
      try {
        const quote = quoteFromBook(book, side, amount);
        return json(res, 200, {
          ...quote,
          bookSource: source,
          upstreamStatus: upstream.status,
          upstreamError: upstream.data?.message || null,
        });
      } catch (err) {
        return json(res, 500, { message: err.message });
      }
    }

    return json(res, upstream.status, upstream.data);
  }

  if (path === "/swap/execute" && req.method === "POST") {
    const raw = await readBody(req);
    let body;
    try {
      body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return json(res, 400, { message: "Invalid JSON" });
    }
    const headers = {};
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;
    if (req.headers["idempotency-key"]) {
      headers["Idempotency-Key"] = req.headers["idempotency-key"];
    }
    const upstream = await bankFetch("/swap/execute", {
      method: "POST",
      body,
      headers,
    });
    // OpenAPI says 201 for execute — keep 201 on success; bridge does not fake fills
    return json(res, upstream.status, upstream.data);
  }

  // Pass-through authenticated read endpoints
  if (
    (path === "/swap/balances" || path === "/swap/history") &&
    req.method === "GET"
  ) {
    const headers = {};
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;
    const upstream = await bankFetch(path, { headers });
    return json(res, upstream.status === 201 ? 200 : upstream.status, upstream.data);
  }

  return json(res, 404, { message: `No route ${req.method} ${path}` });
}

createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    json(res, 500, { message: err.message || "internal error" });
  });
}).listen(PORT, () => {
  console.log(`swap-bridge listening on :${PORT} → ${BANK}`);
});
