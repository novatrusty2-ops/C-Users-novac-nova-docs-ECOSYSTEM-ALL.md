#!/usr/bin/env node
/**
 * Live USDT → BNB swap test (70k-capable).
 *
 * Nova Bank lists USDT-USD but not BNB-USDC / BNB-USD / USDT-BNB.
 * Default path:
 *   1) live-quote sell USDT-USD on Nova Bank
 *   2) live-price BNB via CoinGecko (binancecoin)
 *   3) estimate BNB out = USD proceeds ÷ BNB/USD
 *
 * If a BNB bank market appears later, SWAP_LIVE=1 executes bank two-hop.
 * Until then SWAP_LIVE=1 is refused (quote-only hybrid still passes).
 *
 * Env:
 *   SWAP_AMOUNT          default 10; use 70000 for 70k test
 *   SWAP_USD_BUFFER      USD left unspent when bank BNB market exists
 *   SWAP_LIVE=1          execute only when BNB-* market exists
 *   NOVA_BANK_TOKEN | NOVA_BANK_EMAIL (+ optional PIN)
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
const TARGET = Number(AMOUNT);
const SLIPPAGE = process.env.SWAP_SLIPPAGE_BPS
  ? Number(process.env.SWAP_SLIPPAGE_BPS)
  : undefined;
const USD_BUFFER = Number(process.env.SWAP_USD_BUFFER || "0.05");

const BNB_MARKET_CANDIDATES = ["BNB-USDC", "BNB-USD", "USDT-BNB"];

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

function floorUsd(n) {
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
  if (!Number.isFinite(TARGET) || TARGET <= 0) {
    throw new Error(`Invalid SWAP_AMOUNT=${AMOUNT}`);
  }

  console.log("Live USDT → BNB swap test");
  console.log(`base=${BASE}`);
  console.log(
    `mode=${LIVE ? "LIVE EXECUTE" : "LIVE QUOTE (set SWAP_LIVE=1 if BNB market exists)"}`,
  );
  console.log(`amountInUSDT=${AMOUNT}`);

  console.log("1) GET /swap/markets");
  const { data: markets } = await api("GET", "/swap/markets");
  const ids = (Array.isArray(markets) ? markets : []).map((m) => m.id);
  if (!ids.includes("USDT-USD")) throw new Error("Missing market USDT-USD");
  console.log("   ok USDT-USD");

  const bnbMarket = pickBnbMarket(ids);
  if (bnbMarket) console.log(`   ok bank BNB market ${bnbMarket}`);
  else {
    console.log(
      `   no bank BNB market (${BNB_MARKET_CANDIDATES.join(", ")}) — CoinGecko for BNB leg`,
    );
  }

  console.log("2) POST /swap/quote  sell USDT-USD");
  const leg1Body = quoteBody("USDT-USD", "sell", AMOUNT);
  const { status: q1s, data: q1 } = await api("POST", "/swap/quote", { body: leg1Body });
  console.log(`   status=${q1s}`, JSON.stringify(q1));

  const usdOut = Number(q1.amountOut ?? q1.amount_out);
  if (!Number.isFinite(usdOut) || usdOut <= 0) {
    throw new Error("USDT-USD quote missing amountOut");
  }
  const usdForBnb = floorUsd(Math.max(usdOut - USD_BUFFER, 0));

  if (bnbMarket && bnbMarket !== "USDT-BNB") {
    console.log(`3) POST /swap/quote  buy ${bnbMarket} amount=${usdForBnb}`);
    const leg2Body = quoteBody(bnbMarket, "buy", usdForBnb);
    const { status: q2s, data: q2 } = await api("POST", "/swap/quote", { body: leg2Body });
    console.log(`   status=${q2s}`, JSON.stringify(q2));
    console.log(
      "4) summary",
      JSON.stringify(
        {
          route: ["USDT-USD sell", `${bnbMarket} buy`],
          provider: "nova-bank",
          amountInUSDT: AMOUNT,
          usdFromLeg1: String(usdOut),
          usdSpentLeg2: usdForBnb,
          bnbOutEstimate: q2.amountOut,
          avgBnbPrice: q2.avgPrice,
        },
        null,
        2,
      ),
    );

    if (!LIVE) {
      console.log("5) execute skipped (quote-only live test passed)");
      return;
    }

    const token = await authenticate();
    const ex1 = await api("POST", "/swap/execute", {
      token,
      body: leg1Body,
      idempotencyKey: randomUUID(),
    });
    console.log("exec USDT→USD", ex1.status, JSON.stringify(ex1.data));
    const ex2 = await api("POST", "/swap/execute", {
      token,
      body: leg2Body,
      idempotencyKey: randomUUID(),
    });
    console.log("exec →BNB", ex2.status, JSON.stringify(ex2.data));
    console.log("Live USDT → BNB bank execute complete.");
    return;
  }

  console.log("3) GET CoinGecko binancecoin USD");
  const bnbUsd = await liveBnbUsd();
  console.log(`   BNB/USD=${bnbUsd}`);
  const bnbOut = Number(usdForBnb) / bnbUsd;

  const summary = {
    route: ["USDT-USD sell (nova-bank)", "BNB via CoinGecko USD"],
    provider: "hybrid",
    amountInUSDT: AMOUNT,
    usdFromLeg1: String(usdOut),
    usdForBnbEstimate: usdForBnb,
    bnbUsdLive: bnbUsd,
    bnbOutEstimate: bnbOut.toFixed(8),
    bankExecuteSupported: false,
    note: "Nova Bank has no BNB market — BNB leg is live price estimate only",
  };
  console.log("4) summary");
  console.log(JSON.stringify(summary, null, 2));

  if (LIVE) {
    // Still auth + print balances so the live bank side is exercised
    const token = await authenticate();
    console.log("5) GET /swap/balances (live bank check)");
    const { data: balances } = await api("GET", "/swap/balances", { token });
    const usdt = (balances || []).find((b) => b.currency === "USDT");
    console.log("   USDT", usdt || "(none)");
    throw new Error(
      "SWAP_LIVE=1 refused: Nova Bank has no BNB market to settle USDT→BNB. Live hybrid quote above succeeded.",
    );
  }

  console.log("5) execute unavailable (no BNB bank market) — live quote hybrid test passed");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
