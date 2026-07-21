#!/usr/bin/env node
/**
 * Live 70k settle into USDT TRC20 (replaces blocked USDT→BNB bank settle).
 *
 * Path: POST /transfers/exchange
 *   from: USD production fiat account
 *   to:   USDT_TRC20 vault (label "USDT Vault (TRC20)")
 *
 * Default amount: 70000
 * Quote/dry mode: SWAP_LIVE unset/0 — resolves accounts + prints plan only
 * Live: SWAP_LIVE=1 + NOVA_BANK_EMAIL (PIN optional) or NOVA_BANK_TOKEN
 */

import { randomUUID } from "node:crypto";

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const LIVE = process.env.SWAP_LIVE === "1";
const AMOUNT = process.env.SWAP_AMOUNT || "70000";
const TARGET = Number(AMOUNT);
const FROM_ACCOUNT_NUMBER = process.env.USD_ACCOUNT_NUMBER || "4599"; // production USD
const TO_CURRENCY = "USDT_TRC20";

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
    throw new Error("Requires NOVA_BANK_TOKEN or NOVA_BANK_EMAIL (PIN optional)");
  }
  const body = { email };
  if (process.env.NOVA_BANK_PIN) body.pin = process.env.NOVA_BANK_PIN;
  console.log(`auth: POST /auth/start email=${email}`);
  const { data } = await api("POST", "/auth/start", { body });
  const token = pickAccessToken(data);
  if (!token) throw new Error("auth/start missing token");
  return token;
}

function accountsList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function main() {
  if (!Number.isFinite(TARGET) || TARGET <= 0) {
    throw new Error(`Invalid SWAP_AMOUNT=${AMOUNT}`);
  }

  console.log("Live settle → USDT TRC20 (replaces USDT→BNB)");
  console.log(`base=${BASE}`);
  console.log(`mode=${LIVE ? "LIVE EXECUTE" : "PLAN (set SWAP_LIVE=1 to exchange)"}`);
  console.log(`amount=${AMOUNT}`);

  const token = await authenticate();

  console.log("1) GET /accounts");
  const { data: acctPayload } = await api("GET", "/accounts", { token });
  const accounts = accountsList(acctPayload);
  const from = accounts.find((a) => String(a.accountNumber) === String(FROM_ACCOUNT_NUMBER));
  const to = accounts.find((a) => String(a.currency) === TO_CURRENCY);
  if (!from) throw new Error(`USD account ${FROM_ACCOUNT_NUMBER} not found`);
  if (!to) throw new Error(`${TO_CURRENCY} vault not found`);

  console.log(
    "   from",
    from.currency,
    from.protocol,
    "acct",
    from.accountNumber,
    "avail",
    from.available,
  );
  console.log(
    "   to",
    to.currency,
    to.label || "",
    "acct",
    to.accountNumber,
    "avail",
    to.available,
  );

  const plan = {
    route: ["USD production → USDT_TRC20 via /transfers/exchange"],
    fromAccountId: from.id,
    toAccountId: to.id,
    fromAmount: AMOUNT,
    replaces: "USDT→BNB 70k (no BNB market)",
  };
  console.log("2) plan", JSON.stringify(plan, null, 2));

  if (!LIVE) {
    console.log("3) execute skipped");
    return;
  }

  if (Number(from.available) + 1e-9 < TARGET) {
    throw new Error(`Insufficient USD: need ${TARGET}, have ${from.available}`);
  }

  console.log("3) POST /transfers/exchange");
  const { status, data } = await api("POST", "/transfers/exchange", {
    token,
    body: {
      fromAccountId: from.id,
      toAccountId: to.id,
      fromAmount: String(AMOUNT),
    },
    idempotencyKey: randomUUID(),
  });
  console.log("   ", status, JSON.stringify(data));

  const after = await api("GET", "/accounts", { token });
  const accountsAfter = accountsList(after.data);
  const fromAfter = accountsAfter.find((a) => a.id === from.id);
  const toAfter = accountsAfter.find((a) => a.id === to.id);
  console.log("4) balances_after");
  console.log(
    JSON.stringify(
      {
        usdAvailable: fromAfter?.available,
        usdtTrc20Available: toAfter?.available,
        exchangeId: data?.id,
        journalId: data?.journalId,
        status: data?.status,
      },
      null,
      2,
    ),
  );
  console.log("Live USDT TRC20 settle complete.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
