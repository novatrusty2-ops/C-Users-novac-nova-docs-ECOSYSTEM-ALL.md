import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const PORT = 14080 + Math.floor(Math.random() * 200);
const BASE = `http://127.0.0.1:${PORT}`;

let child;

async function waitHealth(ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("bridge did not become healthy");
}

before(async () => {
  child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(PORT),
      NOVAPAY_SANDBOX_BASE:
        process.env.NOVAPAY_SANDBOX_BASE ||
        "https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox",
      PUBLIC_BASE_URL: BASE,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitHealth();
});

after(() => {
  if (child && !child.killed) child.kill("SIGTERM");
});

test("GET /health", async () => {
  const r = await fetch(`${BASE}/health`);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.service, "novapay-bridge");
});

test("GET /api/v1/novapay/status proxies sandbox", async () => {
  const r = await fetch(`${BASE}/api/v1/novapay/status`);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.bridge, true);
  assert.ok(j.partner === "novapay" || j.ok === true || j.status);
  assert.match(String(j.webhookUrl || ""), /webhooks\/novapay/);
});

test("POST /api/v1/novapay/receive", async () => {
  const r = await fetch(`${BASE}/api/v1/novapay/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: "1.00",
      currency: "EUR",
      reference: `bridge-test-${Date.now()}`,
    }),
  });
  assert.ok(r.status < 500, `status ${r.status}`);
  const j = await r.json();
  assert.equal(j.bridge, true);
});

test("POST /api/v1/webhooks/novapay", async () => {
  const r = await fetch(`${BASE}/api/v1/webhooks/novapay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "payment.received", id: "test" }),
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.bridge, true);
});

test("GET /api/v1/novapay/events includes webhook", async () => {
  const r = await fetch(`${BASE}/api/v1/novapay/events?limit=10`);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.ok(Array.isArray(j.events));
  assert.ok(j.events.some((e) => e.type === "novapay.webhook"));
});
