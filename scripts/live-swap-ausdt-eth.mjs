#!/usr/bin/env node
/**
 * Live AUSDT → ETH swap test against Nova Bank production swap API.
 *
 * There is no direct AUSDT-ETH market. Path is two-hop:
 *   1) sell AUSDT-USDC
 *   2) buy  ETH-USDC with USDC proceeds (minus buffer)
 *
 * Execute mode auto-funds AUSDT via buy AUSDT-USDC when inventory is short.
 *
 * Default: live quotes against production (no auth).
 * Execute: set SWAP_LIVE=1 plus NOVA_BANK_TOKEN or NOVA_BANK_EMAIL (+ optional PIN).
 *
 * Env:
 *   NOVA_BANK_API_BASE   default production /api/v1
 *   SWAP_AMOUNT          target AUSDT notional (default 10; use 70000 for 70k test)
 *   SWAP_SLIPPAGE_BPS    optional
 *   SWAP_USDC_BUFFER     USDC left unspent between legs (default 0.05)
 *   SWAP_LIVE=1          POST /swap/execute for fund + both legs
 *   NOVA_BANK_TOKEN | NOVA_BANK_EMAIL (+ optional NOVA_BANK_PIN)
 */

import { randomUUID } from "node:crypto";

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const LIVE = process.env.SWAP_LIVE === "1";
const AMOUNT = process.env.SWAP_AMOUNT || "10";
const TARGET = Number(AMOUNT);
const SLIPPAGE = process.env.SWAP_SLIPPAGE_BPS
  ? Number(process.env.SWAP_SLIPPAGE_BPS)
  : undefined;
const USDC_BUFFER = Number(process.env.SWAP_USDC_BUFFER || "0.05");

async function api(method, path, { token, body, idempotencyKey } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { status: res.status, data };
}

function pickAccessToken(authPayload) {
  return (
    authPayload?.accessToken ||
    authPayload?.access_token ||
    authPayload?.token ||
    authPayload?.tokens?.accessToken ||
    authPayload?.tokens?.access_token ||
    authPayload?.data?.accessToken ||
    null
  );
}

async function authenticate() {
  if (process.env.NOVA_BANK_TOKEN) {
    console.log("auth: NOVA_BANK_TOKEN");
    return process.env.NOVA_BANK_TOKEN;
  }
  const email = process.env.NOVA_BANK_EMAIL;
  if (!email) {
    throw new Error(
      "SWAP_LIVE=1 requires NOVA_BANK_TOKEN or NOVA_BANK_EMAIL (PIN optional)",
    );
  }
  const body = { email };
  if (process.env.NOVA_BANK_PIN) body.pin = process.env.NOVA_BANK_PIN;
  console.log(`auth: POST /auth/start email=${email}`);
  const { data } = await api("POST", "/auth/start", { body });
  const token = pickAccessToken(data);
  if (!token) {
    throw new Error(`auth/start missing token: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return token;
}

function quoteBody(marketId, side, amount) {
  const body = { marketId, side, amount: String(amount) };
  if (Number.isFinite(SLIPPAGE)) body.slippageBps = SLIPPAGE;
  return body;
}

function floorUsdc(n) {
  return (Math.floor(n * 1e4) / 1e4).toFixed(4);
}

function balanceOf(balances, currency) {
  const row = (Array.isArray(balances) ? balances : []).find(
    (b) => String(b.currency || "").toUpperCase() === currency,
  );
  return Number(row?.available ?? 0);
}

async function main() {
  if (!Number.isFinite(TARGET) || TARGET <= 0) {
    throw new Error(`Invalid SWAP_AMOUNT=${AMOUNT}`);
  }

  console.log("Live AUSDT → ETH swap test (Nova Bank production)");
  console.log(`base=${BASE}`);
  console.log(`mode=${LIVE ? "LIVE EXECUTE" : "LIVE QUOTE (set SWAP_LIVE=1 to execute)"}`);
  console.log(`amountInAUSDT=${AMOUNT}`);

  console.log("1) GET /swap/markets");
  const { data: markets } = await api("GET", "/swap/markets");
  const ids = (Array.isArray(markets) ? markets : []).map((m) => m.id);
  for (const need of ["AUSDT-USDC", "ETH-USDC"]) {
    if (!ids.includes(need)) throw new Error(`Missing market ${need}`);
    console.log(`   ok ${need}`);
  }
  if (ids.includes("AUSDT-ETH")) {
    console.log("   note: direct AUSDT-ETH exists (unexpected) — still using two-hop");
  } else {
    console.log("   no direct AUSDT-ETH — using AUSDT-USDC → ETH-USDC");
  }

  console.log("2) POST /swap/quote  sell AUSDT-USDC");
  const previewSell = quoteBody("AUSDT-USDC", "sell", AMOUNT);
  const { status: q1s, data: q1 } = await api("POST", "/swap/quote", { body: previewSell });
  console.log(`   status=${q1s}`, JSON.stringify(q1));

  const usdcOut = Number(q1.amountOut ?? q1.amount_out);
  if (!Number.isFinite(usdcOut) || usdcOut <= 0) {
    throw new Error("Leg1 quote missing amountOut");
  }

  const usdcForEth = floorUsdc(Math.max(usdcOut - USDC_BUFFER, 0));
  if (Number(usdcForEth) <= 0) {
    throw new Error(`USDC for ETH leg too small after buffer (${USDC_BUFFER})`);
  }

  console.log(`3) POST /swap/quote  buy ETH-USDC amount=${usdcForEth} (buffer=${USDC_BUFFER})`);
  const previewBuy = quoteBody("ETH-USDC", "buy", usdcForEth);
  const { status: q2s, data: q2 } = await api("POST", "/swap/quote", { body: previewBuy });
  console.log(`   status=${q2s}`, JSON.stringify(q2));

  const ethOut = Number(q2.amountOut ?? q2.amount_out);
  console.log("4) summary");
  console.log(
    JSON.stringify(
      {
        route: ["AUSDT-USDC sell", "ETH-USDC buy"],
        amountInAUSDT: AMOUNT,
        usdcFromLeg1: String(usdcOut),
        usdcSpentLeg2: usdcForEth,
        ethOutEstimate: q2.amountOut,
        ethMinOut: q2.minAmountOut,
        avgEthPrice: q2.avgPrice,
      },
      null,
      2,
    ),
  );

  if (!Number.isFinite(ethOut) || ethOut <= 0) {
    throw new Error("Leg2 quote did not return ETH amountOut");
  }

  if (!LIVE) {
    console.log("5) execute skipped (quote-only live test passed)");
    return;
  }

  const token = await authenticate();

  console.log("5) GET /swap/balances (before)");
  let { data: balances } = await api("GET", "/swap/balances", { token });
  const before = {
    AUSDT: balanceOf(balances, "AUSDT"),
    USDC: balanceOf(balances, "USDC"),
    ETH: balanceOf(balances, "ETH"),
  };
  console.log("   ", JSON.stringify(before));

  let ausdtAvail = before.AUSDT;
  if (ausdtAvail + 1e-12 < TARGET) {
    const fundUsdc = String(TARGET); // buy AUSDT spending ~TARGET USDC
    console.log(`5b) auto-fund AUSDT: buy AUSDT-USDC amount=${fundUsdc} USDC`);
    if (before.USDC + 1e-12 < TARGET) {
      throw new Error(
        `Insufficient USDC to fund AUSDT: need ~${TARGET}, have ${before.USDC}`,
      );
    }
    const fundBody = quoteBody("AUSDT-USDC", "buy", fundUsdc);
    const fundQuote = await api("POST", "/swap/quote", { token, body: fundBody });
    console.log("   fund quote", JSON.stringify(fundQuote.data));
    const fundExec = await api("POST", "/swap/execute", {
      token,
      body: fundBody,
      idempotencyKey: randomUUID(),
    });
    console.log("   fund exec", fundExec.status, JSON.stringify(fundExec.data));
    ({ data: balances } = await api("GET", "/swap/balances", { token }));
    ausdtAvail = balanceOf(balances, "AUSDT");
    console.log("   AUSDT after fund", ausdtAvail);
  }

  const sellAmount = String(ausdtAvail);
  if (Number(sellAmount) <= 0) {
    throw new Error("No AUSDT available to sell after funding");
  }

  console.log(`6) POST /swap/execute  sell AUSDT-USDC amount=${sellAmount}`);
  const sellBody = quoteBody("AUSDT-USDC", "sell", sellAmount);
  const sellQuote = await api("POST", "/swap/quote", { token, body: sellBody });
  console.log("   sell quote", JSON.stringify(sellQuote.data));
  const ex1 = await api("POST", "/swap/execute", {
    token,
    body: sellBody,
    idempotencyKey: randomUUID(),
  });
  console.log("   ", ex1.status, JSON.stringify(ex1.data));

  const usdcFromSell = Number(ex1.data?.amountOut ?? sellQuote.data?.amountOut);
  const spend = floorUsdc(Math.max(usdcFromSell - Math.max(USDC_BUFFER, 0.01), 0));
  if (Number(spend) <= 0) {
    throw new Error("USDC proceeds too small for ETH leg");
  }

  console.log(`7) POST /swap/execute  buy ETH-USDC amount=${spend}`);
  const buyBody = quoteBody("ETH-USDC", "buy", spend);
  const buyQuote = await api("POST", "/swap/quote", { token, body: buyBody });
  console.log("   buy quote", JSON.stringify(buyQuote.data));
  const ex2 = await api("POST", "/swap/execute", {
    token,
    body: buyBody,
    idempotencyKey: randomUUID(),
  });
  console.log("   ", ex2.status, JSON.stringify(ex2.data));

  console.log("8) GET /swap/balances (after) + history");
  const afterBal = await api("GET", "/swap/balances", { token });
  const after = {
    AUSDT: balanceOf(afterBal.data, "AUSDT"),
    USDC: balanceOf(afterBal.data, "USDC"),
    ETH: balanceOf(afterBal.data, "ETH"),
  };
  console.log("   balances_after", JSON.stringify(after));
  const { data: history } = await api("GET", "/swap/history", { token });
  console.log("   history", JSON.stringify(history).slice(0, 1500));

  console.log(
    "RESULT",
    JSON.stringify(
      {
        soldAUSDT: ex1.data?.amountIn,
        usdcFromAusdt: ex1.data?.amountOut,
        spentUSDC: spend,
        boughtETH: ex2.data?.amountOut,
        fillSell: ex1.data?.fillId,
        fillEth: ex2.data?.fillId,
        balancesBefore: before,
        balancesAfter: after,
      },
      null,
      2,
    ),
  );

  console.log("Live AUSDT → ETH execute flow complete.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
