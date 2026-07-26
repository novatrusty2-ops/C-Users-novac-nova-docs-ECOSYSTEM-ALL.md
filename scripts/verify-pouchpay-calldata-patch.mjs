#!/usr/bin/env node
/**
 * Gate: Nest pouchpay-calldata patch embeds a local callData builder
 * (does not require POUCHPAY_BRIDGE_URL).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "patches/nova-bank-api/pouchpay-calldata/src");

const REQUIRED = [
  "abi.ts",
  "tokens.ts",
  "calldata.service.ts",
  "pouchpay-calldata.controller.ts",
  "pouchpay-routes.controller.ts",
  "pouchpay-calldata.module.ts",
  "index.ts",
];

let failed = 0;
for (const name of REQUIRED) {
  const p = join(SRC, name);
  if (!existsSync(p)) {
    console.error(`FAIL missing ${name}`);
    failed += 1;
  } else {
    console.log(`PASS present ${name}`);
  }
}

const controller = readFileSync(join(SRC, "pouchpay-calldata.controller.ts"), "utf8");
if (/POUCHPAY_BRIDGE_URL not set/.test(controller)) {
  console.error("FAIL controller still hard-requires POUCHPAY_BRIDGE_URL");
  failed += 1;
} else {
  console.log("PASS controller does not hard-require bridge");
}

const service = readFileSync(join(SRC, "calldata.service.ts"), "utf8");
for (const needle of [
  "buildQuote",
  "quoteWithOptionalBridge",
  "toAdvancedRoute",
  "encodeSwapExactETHForTokens",
  "on-chain-getAmountsOut",
  "appVersion: '1.9.5'",
  "versionCode: 31",
]) {
  if (!service.includes(needle)) {
    console.error(`FAIL service missing ${needle}`);
    failed += 1;
  } else {
    console.log(`PASS service has ${needle}`);
  }
}

const routes = readFileSync(join(SRC, "pouchpay-routes.controller.ts"), "utf8");
for (const needle of ["v0/quote", "v1/advanced/routes", "HttpStatus.OK"]) {
  if (!routes.includes(needle)) {
    console.error(`FAIL routes controller missing ${needle}`);
    failed += 1;
  } else {
    console.log(`PASS routes has ${needle}`);
  }
}

if (failed) {
  console.error(`FAILED ${failed} checks`);
  process.exit(1);
}
console.log("PASSED: Nest pouchpay-calldata patch embeds callData builder");
