#!/usr/bin/env node
/**
 * Print Nova Bank Railway env checklist for OneX withdraw (no secret values).
 * Reads local .env to confirm which keys are present, then shows exact
 * variable names to set on the Railway service:
 *   nova-bank-api-production-7311
 *
 * After setting vars + redeploy, run:
 *   npm run withdraw:eth-onex  (with SWAP_LIVE=1)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path = resolve(".env")) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const required = [
  ["COBO_API_KEY", "Cobo API key (hex)"],
  ["COBO_API_SECRET", "Cobo Ed25519 seed hex"],
  ["DFNS_AUTH_TOKEN", "Dfns service account JWT"],
  ["DFNS_ORG_ID", "Dfns org id"],
  ["DFNS_CRED_ID", "Dfns credential id"],
  ["DFNS_PRIVATE_KEY", "PEM contents OR use DFNS_PRIVATE_KEY_PATH on the host"],
];

const optional = [
  ["COBO_API_BASE", "https://api.cobo.com"],
  ["DFNS_API_BASE", "https://api.dfns.io"],
  ["ONEX_PROVIDER", "live / hotwallet / dfns / cobo — NOT sandbox"],
  ["ONEX_MODE", "onexchain_live"],
];

console.log("Nova Bank Railway — OneX external withdraw setup");
console.log("Service: nova-bank-api-production-7311.up.railway.app");
console.log("");
console.log("Set these Variables on that Railway service, then Redeploy:");
console.log("");
for (const [key, note] of required) {
  const present =
    key === "DFNS_PRIVATE_KEY"
      ? Boolean(env.DFNS_PRIVATE_KEY) ||
        existsSync(resolve(env.DFNS_PRIVATE_KEY_PATH || ".secrets/dfns-rsa2048.pem"))
      : Boolean(env[key]);
  console.log(`  ${present ? "[local .env OK]" : "[missing locally]"}  ${key}`);
  console.log(`      ${note}`);
}
console.log("");
console.log("Also recommended:");
for (const [key, note] of optional) {
  console.log(`  ${key}=${env[key] || note}`);
}
console.log("");
console.log("Verify after redeploy:");
console.log("  curl -s .../api/v1/crypto/cobo/status   → configured:true");
console.log("  curl -s .../api/v1/crypto/dfns/status   → configured:true");
console.log("  curl -s .../api/v1/onex/status          → provider != sandbox");
console.log("");
console.log(
  "This cloud agent has no Railway project token — vars must be set in the Railway dashboard or via `railway variables`.",
);
