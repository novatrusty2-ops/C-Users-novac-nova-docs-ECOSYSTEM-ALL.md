#!/usr/bin/env node
/**
 * Verify key Nova Bank ecosystem endpoints referenced in ECOSYSTEM.json.
 * Warns on HTTP 4xx/5xx; exits 0 if all primaries respond 2xx/3xx/405.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const eco = JSON.parse(readFileSync(join(root, "ECOSYSTEM.json"), "utf8"));

const checks = [
  { name: "Nova Bank global status", url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/global/status" },
  { name: "Wallet networks", url: "https://nova-bank-api-production-7311.up.railway.app/api/v1/wallet/networks" },
  {
    name: "NovaONE RPC (VPS)",
    url: eco.productionUrls.novaOneRpc,
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    soft: true, // Anaka Connect / VPS may reset while Railway ledger stays healthy
  },
  {
    name: "NRW World RPC",
    url: eco.productionUrls.nrwWorldChain,
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
  },
  { name: "Nova Swap UI", url: eco.productionUrls.novaSwap },
  { name: "NRW Central Bank", url: `${eco.productionUrls.nrwCentralBank}/global/status` },
];

let failed = 0;
let softFailed = 0;

for (const check of checks) {
  try {
    const res = await fetch(check.url, {
      method: check.method ?? "GET",
      headers: check.body ? { "Content-Type": "application/json" } : undefined,
      body: check.body,
      signal: AbortSignal.timeout(10000),
    });
    const ok = res.ok || res.status === 405;
    const status = `${res.status}`;
    if (ok) {
      console.log(`OK  ${check.name} (${status})`);
    } else if (check.soft) {
      console.warn(`SOFT ${check.name} (${status}) ${check.url}`);
      softFailed++;
    } else {
      console.warn(`WARN ${check.name} (${status}) ${check.url}`);
      failed++;
    }
  } catch (err) {
    if (check.soft) {
      console.warn(`SOFT ${check.name}: ${err.message}`);
      softFailed++;
    } else {
      console.warn(`FAIL ${check.name}: ${err.message}`);
      failed++;
    }
  }
}

// Report known-down domains from manifest (informational, not a failure)
const down = eco.urlHealth?.domains?.["novablockchainsystem.com"];
if (down?.status === "down") {
  console.log(`INFO novablockchainsystem.com marked down in manifest (${down.error})`);
}

if (softFailed > 0) {
  console.log(`\n${softFailed} soft check(s) degraded (VPS / Anaka Connect) — see docs/anaka-connect-vps.md`);
}

if (failed > 0) {
  console.warn(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll required primary endpoints healthy");
