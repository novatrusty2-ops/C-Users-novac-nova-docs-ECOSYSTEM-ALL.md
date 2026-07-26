#!/usr/bin/env node
/**
 * Swap all Nova Bank "clone" (member/custodial) tokens → ETH via production swap API.
 *
 * Path (no direct *-ETH markets for clones):
 *   1) for each member coin with inventory (or demo amount): sell {COIN}-USDC
 *   2) buy ETH-USDC with aggregated USDC proceeds (minus buffer)
 *
 * Clone set = ECOSYSTEM mint.memberCoins that have a live {COIN}-USDC market.
 *
 * Default: live quotes against production (no auth required for demo amounts).
 * With auth (even quote-only): uses real /swap/balances for each clone.
 * Execute: set SWAP_LIVE=1 plus NOVA_BANK_TOKEN or NOVA_BANK_EMAIL (+ optional PIN).
 *
 * Env:
 *   NOVA_BANK_API_BASE   default production /api/v1
 *   SWAP_DEMO_AMOUNT     per-coin quote amount when unauthenticated (default 10)
 *   SWAP_SLIPPAGE_BPS    optional
 *   SWAP_USDC_BUFFER     USDC left unspent before ETH buy (default 0.05)
 *   SWAP_LIVE=1          POST /swap/execute for each sell + ETH buy
 *   NOVA_BANK_TOKEN | NOVA_BANK_EMAIL (+ optional NOVA_BANK_PIN)
 *   CLONE_SYMBOLS        optional comma list to restrict (default: all member coins)
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const LIVE = process.env.SWAP_LIVE === "1";
const DEMO_AMOUNT = Number(process.env.SWAP_DEMO_AMOUNT || "10");
const SLIPPAGE = process.env.SWAP_SLIPPAGE_BPS
  ? Number(process.env.SWAP_SLIPPAGE_BPS)
  : undefined;
const USDC_BUFFER = Number(process.env.SWAP_USDC_BUFFER || "0.05");

const DEFAULT_CLONES = loadMemberCoins();

function loadMemberCoins() {
  if (process.env.CLONE_SYMBOLS) {
    return process.env.CLONE_SYMBOLS.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const eco = JSON.parse(readFileSync(join(root, "ECOSYSTEM.json"), "utf8"));
    const coins = eco?.mint?.memberCoins;
    if (Array.isArray(coins) && coins.length) {
      return coins.map((c) => String(c).toUpperCase());
    }
  } catch {
    /* fall through */
  }
  return [
    "SHIVA",
    "ACX",
    "ICX",
    "XRP",
    "E1111",
    "AUSDT",
    "VICTORYA",
    "KUSD",
    "ANAKA",
    "CUSDT",
    "CUSDC",
  ];
}

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
      "Auth requires NOVA_BANK_TOKEN or NOVA_BANK_EMAIL (PIN optional)",
    );
  }
  const body = { email };
  if (process.env.NOVA_BANK_PIN) body.pin = process.env.NOVA_BANK_PIN;
  console.log(`auth: POST /auth/start email=${email}`);
  const { data } = await api("POST", "/auth/start", { body });
  const token = pickAccessToken(data);
  if (!token) {
    throw new Error(
      `auth/start missing token: ${JSON.stringify(data).slice(0, 400)}`,
    );
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
    (b) => String(b.currency || "").toUpperCase() === currency.toUpperCase(),
  );
  return Number(row?.available ?? 0);
}

function formatAmount(n) {
  if (!Number.isFinite(n)) return "0";
  // Keep enough precision for clone units without scientific notation noise.
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
}

async function main() {
  if (!Number.isFinite(DEMO_AMOUNT) || DEMO_AMOUNT <= 0) {
    throw new Error(`Invalid SWAP_DEMO_AMOUNT=${process.env.SWAP_DEMO_AMOUNT}`);
  }

  console.log("Live clone tokens → ETH swap (Nova Bank production)");
  console.log(`base=${BASE}`);
  console.log(
    `mode=${LIVE ? "LIVE EXECUTE" : "LIVE QUOTE (set SWAP_LIVE=1 to execute)"}`,
  );
  console.log(`clones=${DEFAULT_CLONES.join(",")}`);

  console.log("1) GET /swap/markets");
  const { data: markets } = await api("GET", "/swap/markets");
  const marketIds = new Set(
    (Array.isArray(markets) ? markets : []).map((m) => m.id),
  );
  if (!marketIds.has("ETH-USDC")) {
    throw new Error("Missing market ETH-USDC");
  }
  console.log("   ok ETH-USDC");

  const cloneMarkets = [];
  for (const coin of DEFAULT_CLONES) {
    const marketId = `${coin}-USDC`;
    if (marketIds.has(marketId)) {
      cloneMarkets.push({ coin, marketId });
      console.log(`   ok ${marketId}`);
    } else {
      console.log(`   skip ${coin} (no ${marketId} market)`);
    }
  }
  if (!cloneMarkets.length) {
    throw new Error("No clone *-USDC markets available");
  }

  let token = null;
  const wantsAuth =
    LIVE ||
    Boolean(process.env.NOVA_BANK_TOKEN || process.env.NOVA_BANK_EMAIL);
  if (wantsAuth) {
    token = await authenticate();
  }

  let balances = null;
  const inventory = {};
  if (token) {
    console.log("2) GET /swap/balances");
    ({ data: balances } = await api("GET", "/swap/balances", { token }));
    for (const { coin } of cloneMarkets) {
      inventory[coin] = balanceOf(balances, coin);
    }
    inventory.USDC = balanceOf(balances, "USDC");
    inventory.ETH = balanceOf(balances, "ETH");
    console.log("   ", JSON.stringify(inventory));
  } else {
    console.log(
      `2) no auth — quoting SWAP_DEMO_AMOUNT=${DEMO_AMOUNT} per clone market`,
    );
    for (const { coin } of cloneMarkets) {
      inventory[coin] = DEMO_AMOUNT;
    }
    inventory.USDC = 0;
    inventory.ETH = 0;
  }

  const sellPlan = [];
  for (const { coin, marketId } of cloneMarkets) {
    const avail = inventory[coin] ?? 0;
    if (!(avail > 0)) {
      console.log(`   skip ${coin}: available=${avail}`);
      continue;
    }
    sellPlan.push({ coin, marketId, amount: formatAmount(avail) });
  }

  if (!sellPlan.length) {
    throw new Error(
      token
        ? "No clone token balances available to sell"
        : "No clone markets to quote",
    );
  }

  console.log("3) POST /swap/quote  sell each clone → USDC");
  const sellQuotes = [];
  const skipped = [];
  let usdcFromClones = 0;
  for (const leg of sellPlan) {
    const body = quoteBody(leg.marketId, "sell", leg.amount);
    let status;
    let data;
    try {
      ({ status, data } = await api("POST", "/swap/quote", {
        token: token || undefined,
        body,
      }));
    } catch (err) {
      const detail =
        err.data?.message || err.data?.error || err.message || "quote failed";
      console.log(`   skip ${leg.marketId}: ${detail}`);
      skipped.push({ coin: leg.coin, marketId: leg.marketId, reason: detail });
      continue;
    }
    const usdcOut = Number(data.amountOut ?? data.amount_out);
    console.log(
      `   ${leg.marketId} sell ${leg.amount} → status=${status} usdcOut=${usdcOut}`,
    );
    if (!Number.isFinite(usdcOut) || usdcOut <= 0) {
      console.log(`   skip ${leg.marketId}: missing amountOut`);
      skipped.push({
        coin: leg.coin,
        marketId: leg.marketId,
        reason: "missing amountOut",
      });
      continue;
    }
    usdcFromClones += usdcOut;
    sellQuotes.push({ ...leg, usdcOut, quote: data });
  }
  if (!sellQuotes.length) {
    throw new Error(
      `No clone markets quoted successfully${
        skipped.length ? `: ${JSON.stringify(skipped)}` : ""
      }`,
    );
  }

  // In live mode we can also spend existing USDC inventory after sells.
  const usdcPoolEstimate = usdcFromClones + (token ? inventory.USDC || 0 : 0);
  const usdcForEth = floorUsdc(Math.max(usdcPoolEstimate - USDC_BUFFER, 0));
  if (Number(usdcForEth) <= 0) {
    throw new Error(`USDC for ETH leg too small after buffer (${USDC_BUFFER})`);
  }

  console.log(
    `4) POST /swap/quote  buy ETH-USDC amount=${usdcForEth} (buffer=${USDC_BUFFER})`,
  );
  const buyBodyPreview = quoteBody("ETH-USDC", "buy", usdcForEth);
  const { status: qEthStatus, data: qEth } = await api("POST", "/swap/quote", {
    token: token || undefined,
    body: buyBodyPreview,
  });
  console.log(`   status=${qEthStatus}`, JSON.stringify(qEth));
  const ethOut = Number(qEth.amountOut ?? qEth.amount_out);
  if (!Number.isFinite(ethOut) || ethOut <= 0) {
    throw new Error("ETH-USDC quote did not return amountOut");
  }

  const summary = {
    route: [
      ...sellQuotes.map((q) => `${q.marketId} sell`),
      "ETH-USDC buy",
    ],
    sells: sellQuotes.map((q) => ({
      coin: q.coin,
      amountIn: q.amount,
      usdcOut: q.usdcOut,
    })),
    skipped,
    usdcFromClones,
    usdcPoolEstimate,
    usdcSpentLeg2: usdcForEth,
    ethOutEstimate: qEth.amountOut,
    ethMinOut: qEth.minAmountOut,
    avgEthPrice: qEth.avgPrice,
    destinationHint: "0x5227115Ba7c8694218f570c1EC2a680095872820",
  };
  console.log("5) summary");
  console.log(JSON.stringify(summary, null, 2));

  if (!LIVE) {
    console.log("6) execute skipped (quote-only)");
    return;
  }

  if (!token) {
    throw new Error("SWAP_LIVE=1 requires authentication");
  }

  console.log("6) LIVE execute — sell each clone");
  const fills = [];
  for (const leg of sellQuotes) {
    // Re-read balance so we sell what's actually available.
    ({ data: balances } = await api("GET", "/swap/balances", { token }));
    const avail = balanceOf(balances, leg.coin);
    const sellAmount = formatAmount(avail);
    if (!(Number(sellAmount) > 0)) {
      console.log(`   skip ${leg.coin}: no available balance`);
      continue;
    }
    const sellBody = quoteBody(leg.marketId, "sell", sellAmount);
    const sellQuote = await api("POST", "/swap/quote", { token, body: sellBody });
    console.log(`   quote ${leg.marketId}`, JSON.stringify(sellQuote.data));
    const ex = await api("POST", "/swap/execute", {
      token,
      body: sellBody,
      idempotencyKey: randomUUID(),
    });
    console.log(`   exec ${leg.marketId}`, ex.status, JSON.stringify(ex.data));
    fills.push({
      coin: leg.coin,
      marketId: leg.marketId,
      amountIn: ex.data?.amountIn ?? sellAmount,
      amountOut: ex.data?.amountOut,
      fillId: ex.data?.fillId,
    });
  }

  ({ data: balances } = await api("GET", "/swap/balances", { token }));
  const usdcAvail = balanceOf(balances, "USDC");
  const spend = floorUsdc(Math.max(usdcAvail - Math.max(USDC_BUFFER, 0.01), 0));
  if (Number(spend) <= 0) {
    throw new Error(`USDC proceeds too small for ETH leg (available=${usdcAvail})`);
  }

  console.log(`7) POST /swap/execute  buy ETH-USDC amount=${spend}`);
  const buyBody = quoteBody("ETH-USDC", "buy", spend);
  const buyQuote = await api("POST", "/swap/quote", { token, body: buyBody });
  console.log("   buy quote", JSON.stringify(buyQuote.data));
  const exEth = await api("POST", "/swap/execute", {
    token,
    body: buyBody,
    idempotencyKey: randomUUID(),
  });
  console.log("   ", exEth.status, JSON.stringify(exEth.data));

  console.log("8) GET /swap/balances (after)");
  const afterBal = await api("GET", "/swap/balances", { token });
  const after = {};
  for (const { coin } of cloneMarkets) {
    after[coin] = balanceOf(afterBal.data, coin);
  }
  after.USDC = balanceOf(afterBal.data, "USDC");
  after.ETH = balanceOf(afterBal.data, "ETH");
  console.log("   balances_after", JSON.stringify(after));

  const { data: history } = await api("GET", "/swap/history", { token });
  console.log("   history", JSON.stringify(history).slice(0, 1500));

  console.log(
    "RESULT",
    JSON.stringify(
      {
        fills,
        spentUSDC: spend,
        boughtETH: exEth.data?.amountOut,
        fillEth: exEth.data?.fillId,
        balancesBefore: inventory,
        balancesAfter: after,
        withdrawTo: "0x5227115Ba7c8694218f570c1EC2a680095872820",
        next: "npm run withdraw:eth-onex  (SWAP_LIVE=1 ETH_TO_ADDRESS set)",
      },
      null,
      2,
    ),
  );
  console.log("Live clone tokens → ETH execute flow complete.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
