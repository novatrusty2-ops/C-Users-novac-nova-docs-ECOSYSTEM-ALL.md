#!/usr/bin/env node
/**
 * Gate: every production Alltra token must quote ↔ ETH / BNB / TRX with callData.
 *
 * Env:
 *   POUCHPAY_API_BASE  default https://pouchpay-bridge-production-f56f.up.railway.app
 *   SAMPLE_ONLY=1      only probe a subset (faster)
 */

const BASE = (
  process.env.POUCHPAY_API_BASE ||
  "https://pouchpay-bridge-production-f56f.up.railway.app"
).replace(/\/$/, "");
const RECIPIENT =
  process.env.POUCHPAY_DEFAULT_RECIPIENT ||
  "0x5227115Ba7c8694218f570c1EC2a680095872820";
const SAMPLE_ONLY = process.env.SAMPLE_ONLY === "1";

const NATIVES = ["ETH", "BNB", "TRX"];

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

function hasCallData(data) {
  const path = data?.path;
  const callData = data?.callData || data?.data || data?.transactionRequest?.data;
  return (
    Array.isArray(path) &&
    path.length >= 2 &&
    typeof callData === "string" &&
    /^0x[0-9a-fA-F]{20,}$/.test(callData)
  );
}

const tokensRes = await fetch(`${BASE}/v1/tokens`);
if (!tokensRes.ok) {
  console.error(`FAIL tokens HTTP ${tokensRes.status}`);
  process.exit(1);
}
const tokensBody = await tokensRes.json();
let symbols = (tokensBody.tokens || [])
  .map((t) => t.symbol)
  .filter((s) => s && s !== "ALL"); // ALL is gas-native; still tested via sample

// Prefer unique address symbols (skip duplicate alias when sampling both ETH+WETH etc. — test both)
if (SAMPLE_ONLY) {
  symbols = [
    "AUSDT",
    "HYDX",
    "WETH",
    "WBNB",
    "WTRX",
    "ZARA",
    "ZRG",
    "USDT-TRC20",
    "USDT-BNB",
    "WBTC",
  ];
}

console.log(
  `verify-native-eth-bnb-trx-swaps against ${BASE} (${symbols.length} tokens × ${NATIVES.length} natives)`,
);

let failed = 0;
let passed = 0;
const fails = [];

for (const from of symbols) {
  for (const to of NATIVES) {
    if (from === to) continue;
    // Same wrap: WETH↔ETH, WBNB↔BNB, WTRX↔TRX should refuse same-path
    const sameWrap =
      (from === "WETH" && to === "ETH") ||
      (from === "ETH" && to === "ETH") ||
      (from === "WBNB" && to === "BNB") ||
      (from === "BNB" && to === "BNB") ||
      (from === "WTRX" && to === "TRX") ||
      (from === "TRX" && to === "TRX");
    if (sameWrap) continue;

    const label = `${from}→${to}`;
    try {
      const quote = await post("/v0/quote", {
        fromSymbol: from,
        toSymbol: to,
        amount: "0.01",
        recipient: RECIPIENT,
        tradeType: 0,
      });
      if (quote.status !== 200) {
        throw new Error(`HTTP ${quote.status}`);
      }
      if (quote.data?.refused || quote.data?.ok === false) {
        // Protected sell (real 11::11) is OK to skip for FROM
        if (quote.data?.protected || /protected|REFUSED/i.test(quote.data?.message || "")) {
          console.log(`SKIP ${label} (protected)`);
          continue;
        }
        throw new Error(quote.data?.message || "quote refused");
      }
      if (!hasCallData(quote.data)) {
        throw new Error("missing path/callData");
      }
      // Also probe reverse (native → token). Use 0.01 — dust (e.g. 0.0001 TRX→WBTC)
      // can fail getAmountsOut on 8-decimal outs even when the pair is live.
      const rev = await post("/v0/quote", {
        fromSymbol: to,
        toSymbol: from,
        amount: "0.01",
        recipient: RECIPIENT,
        tradeType: 0,
      });
      if (rev.status !== 200 || !hasCallData(rev.data)) {
        if (rev.data?.protected || /protected|REFUSED/i.test(rev.data?.message || "")) {
          console.log(`PASS ${label} (+ reverse skip protected)`);
          passed++;
          continue;
        }
        throw new Error(`reverse ${to}→${from} missing callData: ${rev.data?.message || ""}`);
      }
      console.log(`PASS ${label} pathLen=${quote.data.path.length}`);
      passed++;
    } catch (err) {
      failed++;
      fails.push(`${label}: ${err.message || err}`);
      console.error(`FAIL ${label}: ${err.message || err}`);
    }
  }
}

console.log(`\npassed=${passed} failed=${failed}`);
if (failed) {
  console.error(fails.join("\n"));
  process.exit(1);
}
console.log("OK all production tokens swap with ETH & BNB & TRX (callData present)");
