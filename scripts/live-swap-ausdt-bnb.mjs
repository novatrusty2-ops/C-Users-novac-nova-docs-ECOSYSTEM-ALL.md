#!/usr/bin/env node
/**
 * Live AUSDT → BNB swap test.
 *
 * Nova Bank production currently lists AUSDT-USDC but NOT BNB-USDC / BNB-USD /
 * AUSDT-BNB. This script:
 *   1) live-quotes AUSDT → USDC on Nova Bank
 *   2) live-prices BNB via CoinGecko (binancecoin)
 *   3) estimates AUSDT → BNB out (USDC proceeds ÷ BNB/USD)
 *   4) if a BNB bank market appears later, can execute two-hop like ETH
 *
 * Default: live quote (no auth).
 * Execute: SWAP_LIVE=1 + auth — only when a BNB-* market exists.
 *
 * Env:
 *   NOVA_BANK_API_BASE, SWAP_AMOUNT, SWAP_USDC_BUFFER, SWAP_SLIPPAGE_BPS
 *   SWAP_LIVE, NOVA_BANK_TOKEN | NOVA_BANK_EMAIL + NOVA_BANK_PIN
 *   COINGECKO_API_BASE (default https://api.coingecko.com/api/v3)
 */

import { randomUUID } from "node:crypto";

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const CG =
  process.env.COINGECKO_API_BASE?.replace(/\/$/, "") ||
  "https://api.coingecko.com/api/v3";

const LIVE = process.env.SWAP_LIVE === "1";
const AMOUNT = process.env.SWAP_AMOUNT || "10";
const SLIPPAGE = process.env.SWAP_SLIPPAGE_BPS
  ? Number(process.env.SWAP_SLIPPAGE_BPS)
  : undefined;
const USDC_BUFFER = Number(process.env.SWAP_USDC_BUFFER || "0.05");

const BNB_MARKET_CANDIDATES = ["BNB-USDC", "BNB-USD", "AUSDT-BNB"];

async function api(method, path, { token, body, idempotencyKey, base = BASE } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${base}${path}`, {
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
  const pin = process.env.NOVA_BANK_PIN;
  if (!email || !pin) {
    throw new Error(
      "SWAP_LIVE=1 requires NOVA_BANK_TOKEN or NOVA_BANK_EMAIL + NOVA_BANK_PIN",
    );
  }
  console.log(`auth: POST /auth/start email=${email}`);
  const { data } = await api("POST", "/auth/start", { body: { email, pin } });
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

function pickBnbMarket(ids) {
  for (const id of BNB_MARKET_CANDIDATES) {
    if (ids.includes(id)) return id;
  }
  return null;
}

async function liveBnbUsd() {
  const { data } = await api(
    "GET",
    "/simple/price?ids=binancecoin&vs_currencies=usd",
    { base: CG },
  );
  const px = Number(data?.binancecoin?.usd);
  if (!Number.isFinite(px) || px <= 0) {
    throw new Error(`CoinGecko BNB price unavailable: ${JSON.stringify(data)}`);
  }
  return px;
}

async function main() {
  console.log("Live AUSDT → BNB swap test");
  console.log(`base=${BASE}`);
  console.log(`mode=${LIVE ? "LIVE EXECUTE" : "LIVE QUOTE (set SWAP_LIVE=1 to execute if BNB market exists)"}`);
  console.log(`amountInAUSDT=${AMOUNT}`);

  console.log("1) GET /swap/markets");
  const { data: markets } = await api("GET", "/swap/markets");
  const ids = (Array.isArray(markets) ? markets : []).map((m) => m.id);
  if (!ids.includes("AUSDT-USDC")) throw new Error("Missing market AUSDT-USDC");
  console.log("   ok AUSDT-USDC");

  const bnbMarket = pickBnbMarket(ids);
  if (bnbMarket) {
    console.log(`   ok bank BNB market ${bnbMarket}`);
  } else {
    console.log(
      `   no bank BNB market (${BNB_MARKET_CANDIDATES.join(", ")}) — using CoinGecko for BNB leg`,
    );
  }

  console.log("2) POST /swap/quote  sell AUSDT-USDC");
  const leg1Body = quoteBody("AUSDT-USDC", "sell", AMOUNT);
  const { status: q1s, data: q1 } = await api("POST", "/swap/quote", { body: leg1Body });
  console.log(`   status=${q1s}`, JSON.stringify(q1));

  const usdcOut = Number(q1.amountOut ?? q1.amount_out);
  if (!Number.isFinite(usdcOut) || usdcOut <= 0) {
    throw new Error("Leg1 quote missing amountOut");
  }

  const usdcForBnb = floorUsdc(Math.max(usdcOut - USDC_BUFFER, 0));
  if (Number(usdcForBnb) <= 0) {
    throw new Error(`USDC for BNB leg too small after buffer (${USDC_BUFFER})`);
  }

  let summary;

  if (bnbMarket && bnbMarket !== "AUSDT-BNB") {
    console.log(`3) POST /swap/quote  buy ${bnbMarket} amount=${usdcForBnb}`);
    const leg2Body = quoteBody(bnbMarket, "buy", usdcForBnb);
    const { status: q2s, data: q2 } = await api("POST", "/swap/quote", { body: leg2Body });
    console.log(`   status=${q2s}`, JSON.stringify(q2));
    const bnbOut = Number(q2.amountOut ?? q2.amount_out);
    if (!Number.isFinite(bnbOut) || bnbOut <= 0) {
      throw new Error("Leg2 quote did not return BNB amountOut");
    }
    summary = {
      route: ["AUSDT-USDC sell", `${bnbMarket} buy`],
      provider: "nova-bank",
      amountInAUSDT: AMOUNT,
      usdcFromLeg1: String(usdcOut),
      usdcSpentLeg2: usdcForBnb,
      bnbOutEstimate: q2.amountOut,
      bnbMinOut: q2.minAmountOut,
      avgBnbPrice: q2.avgPrice,
    };

    console.log("4) summary");
    console.log(JSON.stringify(summary, null, 2));

    if (!LIVE) {
      console.log("5) execute skipped (quote-only live test passed)");
      return;
    }

    const token = await authenticate();
    console.log("5) GET /swap/balances");
    const { data: balances } = await api("GET", "/swap/balances", { token });
    console.log("   ", JSON.stringify(balances).slice(0, 800));

    console.log("6) POST /swap/execute  leg1 AUSDT→USDC");
    const ex1 = await api("POST", "/swap/execute", {
      token,
      body: leg1Body,
      idempotencyKey: randomUUID(),
    });
    console.log("   ", ex1.status, JSON.stringify(ex1.data).slice(0, 800));

    console.log(`7) POST /swap/execute  leg2 → BNB via ${bnbMarket}`);
    const ex2 = await api("POST", "/swap/execute", {
      token,
      body: leg2Body,
      idempotencyKey: randomUUID(),
    });
    console.log("   ", ex2.status, JSON.stringify(ex2.data).slice(0, 800));

    console.log("8) GET /swap/history");
    const { data: history } = await api("GET", "/swap/history", { token });
    console.log("   ", JSON.stringify(history).slice(0, 1000));
    console.log("Live AUSDT → BNB execute flow complete.");
    return;
  }

  if (bnbMarket === "AUSDT-BNB") {
    console.log("3) POST /swap/quote  sell AUSDT-BNB (direct)");
    const directBody = quoteBody("AUSDT-BNB", "sell", AMOUNT);
    const { status, data } = await api("POST", "/swap/quote", { body: directBody });
    console.log(`   status=${status}`, JSON.stringify(data));
    summary = {
      route: ["AUSDT-BNB sell"],
      provider: "nova-bank",
      amountInAUSDT: AMOUNT,
      bnbOutEstimate: data.amountOut,
      bnbMinOut: data.minAmountOut,
      avgBnbPrice: data.avgPrice,
    };
    console.log("4) summary");
    console.log(JSON.stringify(summary, null, 2));
    if (!LIVE) {
      console.log("5) execute skipped (quote-only live test passed)");
      return;
    }
    const token = await authenticate();
    const ex = await api("POST", "/swap/execute", {
      token,
      body: directBody,
      idempotencyKey: randomUUID(),
    });
    console.log("execute", ex.status, JSON.stringify(ex.data).slice(0, 800));
    return;
  }

  // Hybrid live path: Bank AUSDT-USDC + CoinGecko BNB
  console.log("3) GET CoinGecko binancecoin USD (live BNB price)");
  const bnbUsd = await liveBnbUsd();
  console.log(`   BNB/USD=${bnbUsd}`);

  const bnbOut = Number(usdcForBnb) / bnbUsd;
  summary = {
    route: ["AUSDT-USDC sell (nova-bank)", "BNB via CoinGecko USD"],
    provider: "hybrid",
    amountInAUSDT: AMOUNT,
    usdcFromLeg1: String(usdcOut),
    usdcForBnbEstimate: usdcForBnb,
    bnbUsdLive: bnbUsd,
    bnbOutEstimate: bnbOut.toFixed(8),
    bankExecuteSupported: false,
    note: "Nova Bank has no BNB market yet — execute disabled",
  };

  console.log("4) summary");
  console.log(JSON.stringify(summary, null, 2));

  if (LIVE) {
    throw new Error(
      "SWAP_LIVE=1 refused: Nova Bank has no BNB market to execute against. Quote-only hybrid path is available.",
    );
  }

  console.log("5) execute unavailable (no BNB bank market) — live quote hybrid test passed");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
