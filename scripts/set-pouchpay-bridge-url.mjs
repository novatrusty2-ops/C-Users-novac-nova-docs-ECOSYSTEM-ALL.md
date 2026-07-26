#!/usr/bin/env node
/**
 * Stamp deployed pouchpay-bridge origin into ECOSYSTEM.json.
 *
 * Usage:
 *   node scripts/set-pouchpay-bridge-url.mjs https://pouchpay-bridge-production.up.railway.app
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ecoPath = join(root, "ECOSYSTEM.json");

const raw = (process.argv[2] || process.env.POUCHPAY_BRIDGE_URL || "").trim();
if (!raw) {
  console.error(
    "Usage: npm run set:pouchpay-bridge-url -- https://<railway-bridge-domain>",
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
const pouch = eco.products?.pouchPay || eco.pouchPay || {};

pouch.bridgeUrl = bridgeUrl;
pouch.quoteApi = `${bridgeUrl}/v0/quote`;
pouch.routesApi = `${bridgeUrl}/v1/advanced/routes`;
pouch.healthUrl = `${bridgeUrl}/health`;
pouch.liveBuild = pouch.liveBuild || "31.195";
pouch.appVersion = pouch.appVersion || "31.195";
pouch.versionCode = pouch.versionCode || 31195;
pouch.note =
  "Railway pouchpay-bridge live — quotes return path + callData + HTTP 200; Bank POUCHPAY_QUOTE_API pointed here";

if (eco.products) eco.products.pouchPay = { ...(eco.products.pouchPay || {}), ...pouch };
if (eco.pouchPay) eco.pouchPay = { ...eco.pouchPay, ...pouch };

writeFileSync(ecoPath, `${JSON.stringify(eco, null, 2)}\n`);
console.log("Updated ECOSYSTEM.json:");
console.log("  pouchPay.bridgeUrl =", bridgeUrl);
console.log("  pouchPay.quoteApi  =", pouch.quoteApi);
console.log("  pouchPay.routesApi =", pouch.routesApi);

const health = await fetch(`${bridgeUrl}/health`).then((r) => r.json()).catch((e) => ({ error: String(e) }));
console.log("health:", health?.status || health?.ok || health);
