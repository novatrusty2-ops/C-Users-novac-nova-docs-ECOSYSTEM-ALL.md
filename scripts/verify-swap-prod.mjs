#!/usr/bin/env node
/**
 * Production swap readiness gate.
 *
 * Asserts every market from GET /swap/markets:
 *   - orderbook HTTP 200
 *   - quote sell HTTP 200 (OpenAPI contract)
 *
 * Default target: Nova Bank production (will fail today on quote 201 + 7 missing books).
 * Point at swap-bridge for the HTTP-200-ready surface:
 *
 *   SWAP_API_BASE=http://127.0.0.1:4081 npm run verify:swap-prod
 *
 * Env:
 *   SWAP_API_BASE / NOVA_BANK_API_BASE  (default production /api/v1)
 *   SWAP_QUOTE_AMOUNT                   default 1
 *   SWAP_ALLOW_201=1                    transitional: accept quote 201 as pass
 */

const BASE = (
  process.env.SWAP_API_BASE ||
  process.env.NOVA_BANK_API_BASE ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1"
).replace(/\/$/, "");

const AMOUNT = process.env.SWAP_QUOTE_AMOUNT || "1";
const ALLOW_201 = process.env.SWAP_ALLOW_201 === "1";

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

function quoteOk(status) {
  if (status === 200) return true;
  if (ALLOW_201 && status === 201) return true;
  return false;
}

async function main() {
  console.log(`verify-swap-prod base=${BASE}`);
  console.log(`require quote HTTP ${ALLOW_201 ? "200|201" : "200"}`);

  const statusRes = await api("GET", "/swap/status");
  console.log("status", statusRes.status, JSON.stringify(statusRes.data).slice(0, 300));

  const marketsRes = await api("GET", "/swap/markets");
  if (marketsRes.status !== 200 || !Array.isArray(marketsRes.data)) {
    throw new Error(`markets failed: ${marketsRes.status}`);
  }
  const markets = marketsRes.data;
  console.log(`markets=${markets.length}`);

  const rows = [];
  for (const m of markets) {
    const id = m.id;
    const ob = await api("GET", `/swap/orderbook?market=${encodeURIComponent(id)}`);
    const q = await api("POST", "/swap/quote", {
      marketId: id,
      side: "sell",
      amount: AMOUNT,
    });
    const bookOk = ob.status === 200 && Array.isArray(ob.data?.bids) && ob.data.bids.length > 0;
    const qOk = quoteOk(q.status) && Number(q.data?.amountOut ?? q.data?.amount_out) > 0;
    const row = {
      market: id,
      orderbook: ob.status,
      quote: q.status,
      bookOk,
      quoteOk: qOk,
      amountOut: q.data?.amountOut ?? null,
      bookSource: ob.data?.bookSource || m.bookSource || null,
    };
    rows.push(row);
    const mark = bookOk && qOk ? "OK" : "FAIL";
    console.log(
      `${mark} ${id} book=${ob.status} quote=${q.status} out=${row.amountOut ?? "-"}`,
    );
  }

  const failed = rows.filter((r) => !r.bookOk || !r.quoteOk);
  const summary = {
    base: BASE,
    total: rows.length,
    passed: rows.length - failed.length,
    failed: failed.length,
    requireQuote200: !ALLOW_201,
    failures: failed,
  };
  console.log("SUMMARY", JSON.stringify(summary, null, 2));

  if (failed.length) {
    process.exitCode = 1;
    console.error(
      `FAILED: ${failed.length}/${rows.length} markets not production-ready with HTTP 200`,
    );
  } else {
    console.log(`PASSED: all ${rows.length} markets orderbook+quote → HTTP 200`);
  }
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
