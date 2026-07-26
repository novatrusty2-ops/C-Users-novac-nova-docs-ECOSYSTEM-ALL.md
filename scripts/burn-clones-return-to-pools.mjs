#!/usr/bin/env node
/**
 * Burn / unwind CLONE token inventory and return value into pool assets.
 *
 * Allowlist (clones only):
 *   E1111  — ledger clone of 11:11 (NOT real 11::11)
 *   ZARA, ZRG — Zaragoza clones
 *   WBNB, WTRX — wrap clones
 *
 * WETHIR — not listed on api.pouchpay.io / Alltra (skipped).
 *
 * PROTECTED (never burned / never sold):
 *   11::11, 11:11, GLD1111, ALL, WALL, AUSDT, WETH, BTC, ETH, USDC, USDT, NOVA, NRW
 *
 * Flow (dry-run by default):
 *   1) Sell each on-chain clone → AUSDT via pouchpay-bridge (callData)
 *   2) Sell ledger clone E1111 → USDC via Bank /swap/quote (marionette)
 *   3) Return proceeds into pool-side assets (AUSDT already; optional ALL buy)
 *
 * Live execute requires explicit flags + auth — this script never signs for you
 * unless SWAP_LIVE=1 and CONFIRM_BURN_CLONES=YES.
 *
 * Env:
 *   POUCHPAY_API_BASE     default https://pouchpay-bridge-production.up.railway.app
 *   NOVA_BANK_API_BASE    default production /api/v1
 *   CLONE_AMOUNT          demo amount per clone (default 0.01)
 *   POOL_ASSET            AUSDT | ALL (default AUSDT)
 *   RECIPIENT             0x… for callData quotes
 *   SWAP_LIVE=1           attempt Bank /swap/execute for E1111 only
 *   CONFIRM_BURN_CLONES=YES  required with SWAP_LIVE
 *   NOVA_BANK_TOKEN | NOVA_BANK_EMAIL (+ PIN)
 */

const BRIDGE = (
  process.env.POUCHPAY_API_BASE ||
  "https://pouchpay-bridge-production.up.railway.app"
).replace(/\/$/, "");
const BANK = (
  process.env.NOVA_BANK_API_BASE ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1"
).replace(/\/$/, "");

const CLONE_ONCHAIN = ["ZARA", "ZRG", "WBNB", "WTRX"];
const CLONE_LEDGER = ["E1111"];
const MISSING = ["WETHIR"]; // requested but not in production token list

const PROTECTED = new Set([
  "11::11",
  "11:11",
  "11;11",
  "GLD1111",
  "ALL",
  "WALL",
  "AUSDT",
  "AUSDC",
  "WETH",
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "NOVA",
  "NRW",
]);

const AMOUNT = process.env.CLONE_AMOUNT || "0.01";
const POOL_ASSET = (process.env.POOL_ASSET || "AUSDT").toUpperCase();
const RECIPIENT =
  process.env.RECIPIENT ||
  process.env.POUCHPAY_DEFAULT_RECIPIENT ||
  "0x5227115Ba7c8694218f570c1EC2a680095872820";
const LIVE = process.env.SWAP_LIVE === "1";
const CONFIRMED = process.env.CONFIRM_BURN_CLONES === "YES";

function assertNotProtected(sym) {
  const s = String(sym).toUpperCase();
  if (PROTECTED.has(s) || s === "11::11" || s.includes("11::11")) {
    throw new Error(`REFUSED: ${sym} is protected (real 11:11 / native rail)`);
  }
}

async function post(url, body, token) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
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

async function quoteOnChainClone(symbol) {
  assertNotProtected(symbol);
  const { status, data } = await post(`${BRIDGE}/v0/quote`, {
    fromSymbol: symbol,
    toSymbol: POOL_ASSET,
    amount: AMOUNT,
    recipient: RECIPIENT,
    tradeType: 0,
  });
  if (status !== 200 || !data?.callData || !(data.path || []).length) {
    throw new Error(
      `bridge quote ${symbol}→${POOL_ASSET} failed HTTP ${status}: ${JSON.stringify(data?.message || data)}`,
    );
  }
  if ((data.fromSymbol || symbol).toUpperCase() === "11::11") {
    throw new Error("REFUSED: quote targeted real 11::11");
  }
  return data;
}

async function quoteLedgerE1111(token) {
  assertNotProtected("E1111");
  const body = {
    marketId: "E1111-USDC",
    side: "sell",
    amount: String(AMOUNT),
  };
  const { status, data } = await post(`${BANK}/swap/quote`, body, token);
  if (!(status === 200 || status === 201)) {
    throw new Error(`E1111-USDC quote HTTP ${status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log("burn-clones-return-to-pools");
  console.log("  bridge:", BRIDGE);
  console.log("  bank:  ", BANK);
  console.log("  pool:  ", POOL_ASSET);
  console.log("  amount:", AMOUNT, "(per clone)");
  console.log("  live:  ", LIVE && CONFIRMED ? "YES" : "dry-run");
  console.log("  protect:", [...PROTECTED].join(", "));
  if (MISSING.length) console.log("  missing (skip):", MISSING.join(", "));

  const plan = { burns: [], ledger: [], returns: [], refused: [] };

  for (const sym of CLONE_ONCHAIN) {
    try {
      const q = await quoteOnChainClone(sym);
      plan.burns.push({
        symbol: sym,
        to: POOL_ASSET,
        amountIn: q.amountIn || AMOUNT,
        amountOut: q.amountOut || q.toAmount || q.you_receive,
        path: q.path,
        callData: q.callData,
        router: q.router,
        transactionRequest: q.transactionRequest,
        note: "swap clone → pool asset (returns value into AUSDT/ALL pool side)",
      });
      console.log(
        `OK on-chain ${sym}→${POOL_ASSET} out=${q.amountOut || q.toAmount} callData=${String(q.callData).slice(0, 12)}…`,
      );
    } catch (err) {
      console.error(`FAIL ${sym}:`, err.message);
      plan.refused.push({ symbol: sym, reason: err.message });
    }
  }

  let token = process.env.NOVA_BANK_TOKEN || "";
  try {
    const q = await quoteLedgerE1111(token || undefined);
    plan.ledger.push({
      symbol: "E1111",
      marketId: "E1111-USDC",
      side: "sell",
      amount: AMOUNT,
      quote: {
        amountOut: q.amountOut || q.toAmount || q.you_receive || q.outputAmount,
        httpStatus: q.httpStatus || null,
      },
      note: "ledger clone of 11:11 — does NOT touch real 11::11",
    });
    console.log("OK ledger E1111→USDC (clone of 11:11 only)");
  } catch (err) {
    console.error("FAIL E1111 ledger:", err.message);
    plan.refused.push({ symbol: "E1111", reason: err.message });
  }

  // Sanity: refuse if any burn path mentions protected 11::11 address
  const REAL_1111 = "0x535ca3048871dc5a6466a6b07559c0d08f773d95";
  for (const b of plan.burns) {
    const path = (b.path || []).map((a) => String(a).toLowerCase());
    if (path.includes(REAL_1111)) {
      throw new Error("REFUSED: burn path included real 11::11 address");
    }
  }

  plan.returns.push({
    action: "pool-side",
    asset: POOL_ASSET,
    detail:
      "Clone sells target AUSDT/ALL so proceeds sit in the live UniswapV2 pool asset (liquidity-side), not as clone inventory.",
  });

  if (LIVE) {
    if (!CONFIRMED) {
      console.error("REFUSED: set CONFIRM_BURN_CLONES=YES to execute");
      process.exit(2);
    }
    if (!token) {
      console.error("REFUSED: SWAP_LIVE needs NOVA_BANK_TOKEN for E1111 execute");
      process.exit(2);
    }
    // Only ledger execute is automated here; on-chain callData must be signed by the holder wallet.
    console.log(
      "LIVE: on-chain callData printed above — sign/broadcast from the holding wallet.",
    );
    console.log("LIVE: ledger E1111 execute via /swap/execute …");
    const sellBody = {
      marketId: "E1111-USDC",
      side: "sell",
      amount: String(AMOUNT),
    };
    const quote = await post(`${BANK}/swap/quote`, sellBody, token);
    const ex = await post(
      `${BANK}/swap/execute`,
      { ...sellBody, quoteId: quote.data?.quoteId || quote.data?.id },
      token,
    );
    console.log("E1111 execute HTTP", ex.status, JSON.stringify(ex.data).slice(0, 300));
  }

  console.log("\nPLAN_JSON");
  console.log(JSON.stringify(plan, null, 2));
  console.log(
    `\nDone. Burned/planned ${plan.burns.length} on-chain clones + ${plan.ledger.length} ledger; real 11::11 untouched.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
