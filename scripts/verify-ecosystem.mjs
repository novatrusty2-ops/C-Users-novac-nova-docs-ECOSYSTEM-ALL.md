#!/usr/bin/env node
/**
 * Verify ECOSYSTEM.json healthChecks — every required check must return HTTP 200.
 * Optional/outage endpoints are listed under urlHealth and are not required.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ecoPath = join(root, "ECOSYSTEM.json");
const eco = JSON.parse(readFileSync(ecoPath, "utf8"));

const rpcBody = JSON.stringify({
  jsonrpc: "2.0",
  method: "eth_blockNumber",
  params: [],
  id: 1,
});

/** Canonical required checks — all must be HTTP 200 */
const defaultChecks = [
  {
    id: "nova-bank-health",
    name: "Nova Bank health",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/health",
  },
  {
    id: "nova-bank-global-status",
    name: "Nova Bank global status",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/global/status",
  },
  {
    id: "nova-bank-wallet-networks",
    name: "Wallet networks",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/wallet/networks",
  },
  {
    id: "nova-bank-docs",
    name: "Nova Bank API docs",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/docs",
  },
  {
    id: "nova-swap-ui",
    name: "Nova Swap UI",
    url: "https://nova-bank-api-production-7311.up.railway.app/swap/",
  },
  {
    id: "nrw-central-bank-health",
    name: "NRW Central Bank health",
    url: "https://nrw-central-bank-api-production.up.railway.app/api/v1/health",
  },
  {
    id: "nrw-central-bank-status",
    name: "NRW Central Bank status",
    url: "https://nrw-central-bank-api-production.up.railway.app/api/v1/global/status",
  },
  {
    id: "nrw-world-rpc",
    name: "NRW World RPC",
    url: "https://nrw-world-chain-production-6029.up.railway.app",
    method: "POST",
    body: rpcBody,
  },
  {
    id: "dbis-138-rpc",
    name: "DBIS 138 / DeFi Oracle RPC",
    url: "https://rpc.defi-oracle.io",
    method: "POST",
    body: rpcBody,
  },
  {
    id: "alltra-rpc",
    name: "ALLTRA mainnet RPC",
    url: "https://mainnet-rpc.alltra.global",
    method: "POST",
    body: rpcBody,
  },
  {
    id: "onex-status",
    name: "OneX / DBIS status via Nova Bank",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/onex/status",
  },
  {
    id: "fineract",
    name: "Hybx Fineract",
    url: "https://fineract.hybxfinance.com/",
  },
];

const checks = (Array.isArray(eco.healthChecks) && eco.healthChecks.length
  ? eco.healthChecks
  : defaultChecks
).map((check) => {
  const method = (check.method ?? "GET").toUpperCase();
  if (method === "POST" && !check.body) {
    return { ...check, method, body: rpcBody };
  }
  return { ...check, method };
});

let failed = 0;
const results = [];

async function fetchWithRetry(check, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(check.url, {
        method: check.method ?? "GET",
        headers: check.body ? { "Content-Type": "application/json" } : undefined,
        body: check.body,
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 200) return res;
      lastErr = new Error(`HTTP ${res.status}`);
      // retry transient upstream blips (502/503/504)
      if (![502, 503, 504, 429].includes(res.status) || i === attempts - 1) {
        return res;
      }
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) throw err;
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw lastErr;
}

for (const check of checks) {
  const started = Date.now();
  try {
    const res = await fetchWithRetry(check);
    const ms = Date.now() - started;
    if (res.status === 200) {
      console.log(`OK  200 ${check.name} (${ms}ms)`);
      results.push({ id: check.id ?? check.name, status: 200, ok: true, ms, url: check.url });
    } else {
      console.warn(`BAD ${res.status} ${check.name} ${check.url}`);
      results.push({ id: check.id ?? check.name, status: res.status, ok: false, ms, url: check.url });
      failed++;
    }
  } catch (err) {
    const ms = Date.now() - started;
    console.warn(`BAD ERR ${check.name}: ${err.message}`);
    results.push({
      id: check.id ?? check.name,
      status: null,
      ok: false,
      ms,
      url: check.url,
      error: String(err.message),
    });
    failed++;
  }
}

// Informational outages (not required for exit 0)
const outages = eco.urlHealth?.outages ?? [];
for (const o of outages) {
  console.log(`INFO outage ${o.id}: ${o.status} — ${o.note ?? o.error ?? ""}`);
}

const stamp = new Date().toISOString();
eco.healthCheckResults = {
  checkedAt: stamp,
  required: results.length,
  passed: results.filter((r) => r.ok).length,
  failed,
  results,
};
if (!Array.isArray(eco.healthChecks) || !eco.healthChecks.length) {
  eco.healthChecks = defaultChecks.map(({ id, name, url, method }) => ({
    id,
    name,
    url,
    ...(method ? { method } : {}),
    expectStatus: 200,
  }));
}
writeFileSync(ecoPath, JSON.stringify(eco, null, 2) + "\n");

if (failed > 0) {
  console.warn(`\n${failed}/${results.length} check(s) not HTTP 200`);
  process.exit(1);
}

console.log(`\nAll ${results.length} required checks HTTP 200`);
