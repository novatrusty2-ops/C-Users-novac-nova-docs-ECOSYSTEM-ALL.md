#!/usr/bin/env node
/**
 * Verify DFNS + Cobo credentials from local .env (gitignored).
 * Does not print secrets. Used for external-withdraw setup checks.
 *
 *   node scripts/verify-custody-creds.mjs
 */

import { createHmac, createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path = resolve(".env")) {
  if (!existsSync(path)) throw new Error("Missing .env (gitignored) with DFNS_/COBO_ vars");
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

async function dfnsOk(env) {
  const base = (env.DFNS_API_BASE || "https://api.dfns.io").replace(/\/$/, "");
  const res = await fetch(`${base}/wallets`, {
    headers: {
      Authorization: `Bearer ${env.DFNS_AUTH_TOKEN}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  const pemPath = resolve(env.DFNS_PRIVATE_KEY_PATH || ".secrets/dfns-rsa2048.pem");
  const pemOk = existsSync(pemPath) && readFileSync(pemPath, "utf8").includes("PRIVATE KEY");
  return {
    ok: res.ok,
    status: res.status,
    walletCount: Array.isArray(data?.items) ? data.items.length : null,
    orgId: env.DFNS_ORG_ID || null,
    credIdSet: Boolean(env.DFNS_CRED_ID),
    pemOk,
  };
}

async function coboOk(env) {
  const base = (env.COBO_API_BASE || "https://api.dev.cobo.com").replace(/\/$/, "");
  const path = "/v2/wallets";
  const method = "GET";
  const ts = String(Date.now());
  const body = "";
  const content = `${ts}${method}${path}${body}`;
  const sig = createHmac("sha256", env.COBO_API_SECRET).update(content).digest("hex");
  const res = await fetch(`${base}${path}`, {
    headers: {
      "Biz-Api-Key": env.COBO_API_KEY,
      "Biz-Api-Timestamp": ts,
      "Biz-Api-Signature": sig,
      Accept: "application/json",
      "User-Agent": "NovaBankCustodyVerify/1.0",
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return {
    ok: res.ok,
    status: res.status,
    error: data?.error_message || data?.message || data?.title || null,
    apiBase: base,
  };
}

const env = loadEnv();
const dfns = await dfnsOk(env);
const cobo = await coboOk(env);

console.log(
  JSON.stringify(
    {
      dfns,
      cobo,
      note:
        "Credentials are local/.env only. Nova Bank Railway must also set DFNS_* and COBO_* for OneX withdraw.",
    },
    null,
    2,
  ),
);

if (!dfns.ok) process.exitCode = 1;
// Cobo may fail here on IP allowlist; do not fail the whole script if DFNS works
if (!dfns.ok && !cobo.ok) process.exitCode = 1;
