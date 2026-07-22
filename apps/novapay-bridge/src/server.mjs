#!/usr/bin/env node
/**
 * NovaPay ↔ Nova Bank bridge (Railway-ready).
 *
 * Implements NestJS-shaped routes from patches/nova-bank-api/novapay-partner by
 * proxying the live NovaPay sandbox already hosted on Nova Bank API.
 *
 * Env:
 *   PORT                     — listen port (Railway sets this)
 *   NOVAPAY_SANDBOX_BASE     — sandbox root (default: Nova Bank API sandbox)
 *   NOVAPAY_API_KEY          — optional bearer for /status, /receive, /send
 *   NOVAPAY_WEBHOOK_SECRET   — optional HMAC secret for inbound webhooks
 *   PUBLIC_BASE_URL          — public https origin of this service (for status.webhookUrl)
 */

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT || 4080);
const SANDBOX_BASE = (
  process.env.NOVAPAY_SANDBOX_BASE ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox"
).replace(/\/$/, "");
const API_KEY = process.env.NOVAPAY_API_KEY || "";
const WEBHOOK_SECRET = process.env.NOVAPAY_WEBHOOK_SECRET || "";

/** Step 3: prefer explicit PUBLIC_BASE_URL; else Railway public domain after Generate Domain. */
function resolvePublicBase() {
  const explicit = (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || "").trim().replace(/\/$/, "");
  if (railwayDomain) {
    return railwayDomain.startsWith("http")
      ? railwayDomain
      : `https://${railwayDomain}`;
  }
  const railwayStatic = (process.env.RAILWAY_STATIC_URL || "").trim().replace(/\/$/, "");
  if (railwayStatic) return railwayStatic;
  return "";
}

const PUBLIC_BASE = resolvePublicBase();

const events = [];
const MAX_EVENTS = 200;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NovaPay-Signature, X-Signature",
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

function authOk(req) {
  if (!API_KEY) return true;
  const h = req.headers.authorization || "";
  return h === `Bearer ${API_KEY}`;
}

function verifyWebhook(raw, headers) {
  if (!WEBHOOK_SECRET) return true;
  const sig =
    headers["x-novapay-signature"] ||
    headers["x-signature"] ||
    "";
  if (!sig) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  const a = Buffer.from(String(sig));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function pushEvent(type, payload) {
  events.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: new Date().toISOString(),
    payload,
  });
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

async function sandboxFetch(path, init) {
  const url = `${SANDBOX_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  if (path === "/health" || path === "/") {
    return json(res, 200, {
      ok: true,
      service: "novapay-bridge",
      sandboxBase: SANDBOX_BASE,
      authRequired: Boolean(API_KEY),
    });
  }

  if (path === "/api/v1/novapay/status" && req.method === "GET") {
    if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
    const remote = await sandboxFetch("/status");
    const base = remote.data && typeof remote.data === "object" ? remote.data : {};
    return json(res, remote.ok ? 200 : remote.status, {
      ...base,
      bridge: true,
      bridgeService: "novapay-bridge",
      sandboxBase: SANDBOX_BASE,
      webhookUrl: PUBLIC_BASE
        ? `${PUBLIC_BASE}/api/v1/webhooks/novapay`
        : base.webhookUrl || null,
      authMethod: API_KEY ? "bearer" : "none",
    });
  }

  if (path === "/api/v1/novapay/events" && req.method === "GET") {
    if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    return json(res, 200, { ok: true, count: events.length, events: events.slice(0, limit) });
  }

  if (path === "/api/v1/novapay/receive" && req.method === "POST") {
    if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
    const raw = await readBody(req);
    let body = {};
    try {
      body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return json(res, 400, { ok: false, error: "invalid_json" });
    }
    const remote = await sandboxFetch("/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    pushEvent("novapay.receive", { request: body, response: remote.data });
    return json(res, remote.ok ? 200 : remote.status, {
      ...(remote.data && typeof remote.data === "object" ? remote.data : { data: remote.data }),
      bridge: true,
    });
  }

  if (path === "/api/v1/novapay/send" && req.method === "POST") {
    if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
    const raw = await readBody(req);
    let body = {};
    try {
      body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return json(res, 400, { ok: false, error: "invalid_json" });
    }
    const remote = await sandboxFetch("/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    pushEvent("novapay.send", { request: body, response: remote.data });
    return json(res, remote.ok ? 200 : remote.status, {
      ...(remote.data && typeof remote.data === "object" ? remote.data : { data: remote.data }),
      bridge: true,
    });
  }

  if (path === "/api/v1/webhooks/novapay" && req.method === "POST") {
    const raw = await readBody(req);
    if (!verifyWebhook(raw, req.headers)) {
      return json(res, 401, { ok: false, error: "invalid_signature" });
    }
    let payload = {};
    try {
      payload = raw.length ? JSON.parse(raw.toString("utf8")) : {};
    } catch {
      return json(res, 400, { ok: false, error: "invalid_json" });
    }
    pushEvent("novapay.webhook", payload);
    return json(res, 200, { ok: true, received: true, bridge: true });
  }

  return json(res, 404, { ok: false, error: "not_found", path });
}

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    json(res, 500, { ok: false, error: "internal_error", message: String(err?.message || err) });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[novapay-bridge] listening on :${PORT}`);
  console.log(`[novapay-bridge] sandbox → ${SANDBOX_BASE}`);
});
