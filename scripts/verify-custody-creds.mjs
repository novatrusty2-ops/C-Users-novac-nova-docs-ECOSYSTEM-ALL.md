#!/usr/bin/env node
/**
 * Verify DFNS + Cobo credentials from local .env (gitignored).
 * Does not print secrets. Used for external-withdraw setup checks.
 *
 * Cobo WaaS 2.0 uses Ed25519 (not HMAC):
 *   str = METHOD|PATH|NONCE|PARAMS|BODY
 *   hash = sha256(sha256(str))
 *   sig  = ed25519.sign(hash, api_secret_hex)
 *
 *   node scripts/verify-custody-creds.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { webcrypto } from "node:crypto";

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

function sha256d(buf) {
  return createHash("sha256")
    .update(createHash("sha256").update(buf).digest())
    .digest();
}

function hexToBytes(hex) {
  const clean = hex.trim().replace(/^0x/, "");
  if (clean.length % 2) throw new Error("invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

/** Ed25519 sign using Node webcrypto (PKCS8 from raw 32-byte seed) */
async function ed25519Sign(secretHex, messageBytes) {
  const seed = hexToBytes(secretHex);
  if (seed.length !== 32) {
    throw new Error(`COBO_API_SECRET must be 32-byte Ed25519 seed hex (got ${seed.length} bytes)`);
  }
  // Node SubtleCrypto importKey for Ed25519 expects PKCS8.
  // Build PKCS8 wrapper around the 32-byte seed.
  const pkcs8Prefix = Uint8Array.from([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(pkcs8Prefix.length + seed.length);
  pkcs8.set(pkcs8Prefix, 0);
  pkcs8.set(seed, pkcs8Prefix.length);

  const key = await webcrypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, [
    "sign",
  ]);
  const sig = await webcrypto.subtle.sign("Ed25519", key, messageBytes);
  return bytesToHex(new Uint8Array(sig));
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
  const base = (env.COBO_API_BASE || "https://api.cobo.com").replace(/\/$/, "");
  const path = "/v2/wallets";
  const method = "GET";
  const nonce = String(Date.now());
  const params = "";
  const body = "";
  const strToSign = `${method}|${path}|${nonce}|${params}|${body}`;
  const contentHash = sha256d(Buffer.from(strToSign, "utf8"));
  const signature = await ed25519Sign(env.COBO_API_SECRET, contentHash);

  const res = await fetch(`${base}${path}`, {
    headers: {
      "Biz-Api-Key": env.COBO_API_KEY,
      "Biz-Api-Nonce": nonce,
      "Biz-Api-Signature": signature,
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
    ok: res.status === 200,
    status: res.status,
    error: data?.error_message || data?.message || data?.title || null,
    apiBase: base,
    walletTotal: data?.pagination?.total_count ?? data?.data?.length ?? null,
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

if (!dfns.ok || !cobo.ok) process.exitCode = 1;
