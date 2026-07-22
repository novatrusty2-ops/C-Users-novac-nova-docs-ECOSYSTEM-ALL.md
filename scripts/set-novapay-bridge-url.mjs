#!/usr/bin/env node
/**
 * Step 3 — stamp Railway bridge domain into ECOSYSTEM.json.
 *
 * Usage:
 *   node scripts/set-novapay-bridge-url.mjs https://novapay-bridge-production-xxxx.up.railway.app
 *   npm run set:novapay-bridge-url -- https://...
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ecoPath = join(root, "ECOSYSTEM.json");

const raw = (process.argv[2] || process.env.NOVAPAY_BRIDGE_URL || "").trim();
if (!raw) {
  console.error(
    "Usage: npm run set:novapay-bridge-url -- https://<railway-bridge-domain>",
  );
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error("Invalid URL:", raw);
  process.exit(1);
}
if (url.protocol !== "https:") {
  console.error("Bridge URL must be https://");
  process.exit(1);
}

const bridgeUrl = url.origin;
const eco = JSON.parse(readFileSync(ecoPath, "utf8"));

eco.novaPay = eco.novaPay || {};
eco.novaPay.bridgeUrl = bridgeUrl;
eco.novaPay.bridgeStatusUrl = `${bridgeUrl}/api/v1/novapay/status`;
eco.novaPay.bridgeWebhookUrl = `${bridgeUrl}/api/v1/webhooks/novapay`;
eco.novaPay.callbackUrlConvention =
  eco.novaPay.callbackUrlConvention || `${bridgeUrl}/api/v1/webhooks/novapay`;

eco.products = eco.products || {};
eco.products.novaPay = eco.products.novaPay || {};
eco.products.novaPay.bridgeUrl = bridgeUrl;

writeFileSync(ecoPath, `${JSON.stringify(eco, null, 2)}\n`);
console.log("Updated ECOSYSTEM.json:");
console.log("  novaPay.bridgeUrl         =", bridgeUrl);
console.log("  novaPay.bridgeStatusUrl   =", eco.novaPay.bridgeStatusUrl);
console.log("  novaPay.bridgeWebhookUrl  =", eco.novaPay.bridgeWebhookUrl);

const statusUrl = `${bridgeUrl}/api/v1/novapay/status`;
try {
  const res = await fetch(statusUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  if (res.ok && body && body.bridge === true) {
    console.log("OK   Live probe:", statusUrl, "→ bridge:true");
  } else {
    console.warn(
      "WARN Live probe:",
      statusUrl,
      `→ HTTP ${res.status}`,
      body?.error || body?.service || "",
    );
    console.warn(
      "     Domain may still be deploying. Re-run after Railway is healthy.",
    );
  }
} catch (err) {
  console.warn("WARN Live probe failed:", err.message || err);
}
