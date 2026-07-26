#!/usr/bin/env node
/**
 * Gate: PouchPay route quotes must include non-empty path + callData.
 *
 * Env:
 *   POUCHPAY_API_BASE  default http://127.0.0.1:4082 (local bridge)
 *                      set to https://api.pouchpay.io to show production gap
 */

const BASE = (process.env.POUCHPAY_API_BASE || "http://127.0.0.1:4082").replace(
  /\/$/,
  "",
);
const RECIPIENT =
  process.env.POUCHPAY_DEFAULT_RECIPIENT ||
  "0x5227115Ba7c8694218f570c1EC2a680095872820";

const PAIRS = [
  ["ALL", "AUSDT"],
  ["AUSDT", "ALL"],
  ["WALL", "AUSDT"],
];

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function assertCallData(label, data) {
  const path = data?.path;
  const callData = data?.callData || data?.data || data?.transactionRequest?.data;
  if (!Array.isArray(path) || path.length < 2) {
    throw new Error(`${label}: path missing/empty`);
  }
  if (typeof callData !== "string" || !/^0x[0-9a-fA-F]{20,}$/.test(callData)) {
    throw new Error(`${label}: callData missing`);
  }
  return true;
}

let failed = 0;
console.log(`verify-pouchpay-routes against ${BASE}`);

for (const [from, to] of PAIRS) {
  const label = `${from}→${to}`;
  try {
    const quote = await post("/v0/quote", {
      fromSymbol: from,
      toSymbol: to,
      amount: "0.01",
      recipient: RECIPIENT,
      tradeType: 0,
    });
    if (quote.status !== 200) throw new Error(`quote HTTP ${quote.status}: ${JSON.stringify(quote.data)}`);
    assertCallData(`quote ${label}`, quote.data);

    const routes = await post("/v1/advanced/routes", {
      fromSymbol: from,
      toSymbol: to,
      amount: "0.01",
      recipient: RECIPIENT,
      tradeType: 0,
    });
    if (routes.status !== 200) throw new Error(`routes HTTP ${routes.status}`);
    const route = routes.data?.routes?.[0];
    if (!route) throw new Error("no routes[0]");
    if (route.toToken?.symbol && route.toToken.symbol.toUpperCase() !== to) {
      throw new Error(`routes toToken ${route.toToken.symbol} != ${to}`);
    }
    const step = route.steps?.[0];
    assertCallData(`routes ${label}`, {
      path: route.path,
      callData: route.callData || step?.callData,
      transactionRequest: route.transactionRequest || step?.transactionRequest,
    });
    console.log(`PASS ${label} callData=${(route.callData || step.callData).slice(0, 10)}…`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${label}: ${err.message}`);
  }
}

if (failed) {
  console.error(`FAILED ${failed}/${PAIRS.length}`);
  process.exit(1);
}
console.log(`PASSED: ${PAIRS.length}/${PAIRS.length} pairs have path + callData`);
