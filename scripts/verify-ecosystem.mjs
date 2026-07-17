#!/usr/bin/env node
/**
 * Verify Nova Bank ecosystem endpoints from ECOSYSTEM.json.
 * - Required (Railway / known-good): must succeed or exit 1
 * - Optional (VPS / public domains): warn only
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const eco = JSON.parse(readFileSync(join(root, "ECOSYSTEM.json"), "utf8"));

const RPC_BODY = JSON.stringify({
  jsonrpc: "2.0",
  method: "eth_blockNumber",
  params: [],
  id: 1,
});

const required = [
  {
    name: "Nova Bank global status",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/global/status",
  },
  {
    name: "Wallet networks",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/wallet/networks",
  },
  {
    name: "Ecosystem tokens",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/chains/ecosystem/tokens",
  },
  {
    name: "NRW World RPC",
    url: eco.productionUrls.nrwWorldChain,
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "Nova Swap UI",
    url: eco.productionUrls.novaSwap,
  },
  {
    name: "NRW Central Bank",
    url: `${eco.productionUrls.nrwCentralBank}/global/status`,
  },
  {
    name: "DeFi Oracle RPC",
    url: eco.productionUrls.dbisRpc,
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "Anaka Bridge RPC",
    url: eco.productionUrls.anakaBridge,
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "Alltra RPC",
    url: eco.productionUrls.alltraRpc || "https://mainnet-rpc.alltra.global",
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "Production node status",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/production-node/status",
  },
  {
    name: "OpenAPI",
    url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/openapi.json",
  },
];

const optional = [
  {
    name: "NovaONE primary RPC",
    url: eco.productionUrls.novaOneRpc,
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "VPS NovaONE RPC",
    url: "http://51.75.64.28/novaone-rpc/",
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
  {
    name: "novablockchainsystem.com status",
    url: "https://novablockchainsystem.com/api/v1/global/status",
  },
  {
    name: "Railway /rpc (production node)",
    url: "https://nova-bank-api-production-7311.up.railway.app/rpc",
    method: "POST",
    body: RPC_BODY,
    expectRpc: true,
  },
];

async function check(entry) {
  const res = await fetch(entry.url, {
    method: entry.method ?? "GET",
    headers: entry.body ? { "Content-Type": "application/json" } : undefined,
    body: entry.body,
    signal: AbortSignal.timeout(12000),
  });
  let rpcOk = false;
  if (entry.expectRpc) {
    try {
      const json = await res.clone().json();
      rpcOk = Boolean(json && "result" in json && !json.error);
    } catch {
      rpcOk = false;
    }
  }
  const ok = entry.expectRpc ? rpcOk : res.ok || res.status === 405;
  return { ok, status: res.status, rpcOk };
}

let failed = 0;
let warned = 0;

console.log("== Required ==");
for (const entry of required) {
  try {
    const { ok, status, rpcOk } = await check(entry);
    if (ok) {
      console.log(`OK   ${entry.name} (${status}${entry.expectRpc ? `, rpc=${rpcOk}` : ""})`);
    } else {
      console.warn(`FAIL ${entry.name} (${status}) ${entry.url}`);
      failed++;
    }
  } catch (err) {
    console.warn(`FAIL ${entry.name}: ${err.message}`);
    failed++;
  }
}

console.log("\n== Optional / known flaky ==");
for (const entry of optional) {
  try {
    const { ok, status, rpcOk } = await check(entry);
    if (ok) {
      console.log(`OK   ${entry.name} (${status}${entry.expectRpc ? `, rpc=${rpcOk}` : ""})`);
    } else {
      console.warn(`WARN ${entry.name} (${status}) ${entry.url}`);
      warned++;
    }
  } catch (err) {
    console.warn(`WARN ${entry.name}: ${err.message}`);
    warned++;
  }
}

const issues = eco.knownIssues || [];
if (issues.length) {
  console.log(`\n== Manifest knownIssues (${issues.length}) ==`);
  for (const issue of issues) {
    console.log(`- [${issue.severity}] ${issue.id}: ${issue.summary}`);
  }
}

const summary = eco.urlHealth?.summary;
if (summary) {
  console.log("\n== urlHealth.summary ==");
  console.log(JSON.stringify(summary, null, 2));
}

if (failed > 0) {
  console.warn(`\n${failed} required check(s) failed; ${warned} optional warning(s)`);
  process.exit(1);
}

console.log(`\nAll required endpoints healthy (${warned} optional warning(s))`);
