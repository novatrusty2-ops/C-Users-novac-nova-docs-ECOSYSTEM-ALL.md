#!/usr/bin/env node
/**
 * Production Nova Bank fiat wire — API-by-API runner.
 *
 * Rail: POST /api/v1/wire/send (MT103 + GPI)
 * Default amount: 100000.00
 *
 * Auth (one of):
 *   NOVA_BANK_TOKEN
 *   NOVA_BANK_EMAIL + NOVA_BANK_PIN
 *
 * Required for send:
 *   WIRE_BENEFICIARY_NAME
 *   WIRE_BENEFICIARY_IBAN
 *   WIRE_BENEFICIARY_SWIFT
 *   WIRE_PIN (4-digit, may match login PIN)
 *
 * Optional:
 *   NOVA_BANK_API_BASE (default production Railway API)
 *   WIRE_FROM_ACCOUNT_ID (else first matching fiat account)
 *   WIRE_AMOUNT (default 100000.00)
 *   WIRE_CURRENCY (filter when auto-picking account; default USD)
 *   WIRE_CHARGE_BEARER (OUR|SHA|BEN, default SHA)
 *   WIRE_LIVE=1 to actually POST /wire/send (otherwise preflight only)
 */

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const LIVE = process.env.WIRE_LIVE === "1";
const AMOUNT = process.env.WIRE_AMOUNT || "100000.00";
const CURRENCY = (process.env.WIRE_CURRENCY || "USD").toUpperCase();
const CHARGE_BEARER = process.env.WIRE_CHARGE_BEARER || "SHA";

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}…${value.slice(-3)}`;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function api(method, path, { token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

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
  return data;
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

function accountsList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function isFiatAccount(account) {
  const assetClass = String(account.assetClass || account.asset_class || "").toLowerCase();
  const type = String(account.type || account.accountType || account.kind || "").toLowerCase();
  const currency = String(account.currency || account.asset || "").toUpperCase();
  if (assetClass === "fiat") return true;
  if (type.includes("fiat") || type.includes("ledger") || type.includes("bank")) return true;
  // Common fiat codes when assetClass omitted
  return ["USD", "EUR", "GBP", "CHF", "AUD", "CAD", "JPY"].includes(currency);
}

function resolveFromAccount(accounts) {
  if (process.env.WIRE_FROM_ACCOUNT_ID) return process.env.WIRE_FROM_ACCOUNT_ID;

  const fiat = accounts.filter(isFiatAccount);
  const prefer = fiat.filter(
    (a) => String(a.currency || a.asset || "").toUpperCase() === CURRENCY,
  );
  const pool = prefer.length ? prefer : fiat.length ? fiat : accounts;
  const chosen = pool[0];
  if (!chosen) throw new Error("No accounts available to fund the wire");
  return chosen.id || chosen.accountId || chosen.uuid;
}

async function authenticate() {
  if (process.env.NOVA_BANK_TOKEN) {
    console.log("1) auth: using NOVA_BANK_TOKEN");
    return process.env.NOVA_BANK_TOKEN;
  }

  const email = process.env.NOVA_BANK_EMAIL;
  const pin = process.env.NOVA_BANK_PIN;
  if (!email || !pin) {
    throw new Error(
      "Set NOVA_BANK_TOKEN or NOVA_BANK_EMAIL + NOVA_BANK_PIN for production auth",
    );
  }

  console.log(`1) POST /auth/start  email=${email}`);
  const started = await api("POST", "/auth/start", {
    body: { email, pin },
  });
  const token = pickAccessToken(started);
  if (!token) {
    throw new Error(
      `auth/start did not return an access token: ${JSON.stringify(started).slice(0, 400)}`,
    );
  }
  return token;
}

async function main() {
  console.log("Nova Bank production wire payout (API-by-API)");
  console.log(`base=${BASE}`);
  console.log(`mode=${LIVE ? "LIVE SEND" : "PREFLIGHT (set WIRE_LIVE=1 to send)"}`);
  console.log(`amount=${AMOUNT} currency_filter=${CURRENCY} chargeBearer=${CHARGE_BEARER}`);

  const token = await authenticate();

  console.log("2) GET /auth/me");
  const me = await api("GET", "/auth/me", { token });
  console.log(
    "   user:",
    me?.email || me?.user?.email || me?.id || me?.user?.id || "(ok)",
  );

  console.log("3) GET /accounts");
  const accountsPayload = await api("GET", "/accounts", { token });
  const accounts = accountsList(accountsPayload);
  console.log(`   accounts=${accounts.length}`);
  for (const a of accounts.slice(0, 12)) {
    console.log(
      "  -",
      a.id || a.accountId,
      a.currency || a.asset,
      a.assetClass || a.type || "",
      a.balance ?? a.availableBalance ?? "",
    );
  }

  const fromAccountId = resolveFromAccount(accounts);
  if (!fromAccountId) throw new Error("Could not resolve fromAccountId");

  const beneficiaryName = process.env.WIRE_BENEFICIARY_NAME;
  const beneficiaryIban = process.env.WIRE_BENEFICIARY_IBAN;
  const beneficiarySwift = process.env.WIRE_BENEFICIARY_SWIFT;
  const wirePin = process.env.WIRE_PIN || process.env.NOVA_BANK_PIN;

  const payload = {
    fromAccountId,
    amount: AMOUNT,
    beneficiaryName,
    beneficiaryIban,
    beneficiarySwift,
    chargeBearer: CHARGE_BEARER,
    pin: wirePin,
  };

  console.log("4) preflight /wire/send payload");
  console.log(
    JSON.stringify(
      {
        ...payload,
        pin: wirePin ? "****" : null,
        beneficiaryIban: mask(beneficiaryIban),
        beneficiarySwift: mask(beneficiarySwift),
      },
      null,
      2,
    ),
  );

  const missing = [
    ["WIRE_BENEFICIARY_NAME", beneficiaryName],
    ["WIRE_BENEFICIARY_IBAN", beneficiaryIban],
    ["WIRE_BENEFICIARY_SWIFT", beneficiarySwift],
    ["WIRE_PIN", wirePin],
  ].filter(([, v]) => !v);

  if (missing.length) {
    console.error(
      "Missing beneficiary/auth fields:",
      missing.map(([k]) => k).join(", "),
    );
    process.exitCode = 2;
    return;
  }

  if (!LIVE) {
    console.log("5) skipped POST /wire/send (preflight only)");
    console.log("6) GET /wire/transfers");
    const transfers = await api("GET", "/wire/transfers", { token });
    console.log("   transfers:", JSON.stringify(transfers).slice(0, 500));
    console.log("Done. Re-run with WIRE_LIVE=1 to submit the production wire.");
    return;
  }

  console.log("5) POST /wire/send  *** LIVE PRODUCTION ***");
  const sent = await api("POST", "/wire/send", { token, body: payload });
  console.log("   response:", JSON.stringify(sent, null, 2).slice(0, 2000));

  console.log("6) GET /wire/transfers");
  const transfers = await api("GET", "/wire/transfers", { token });
  console.log("   transfers:", JSON.stringify(transfers).slice(0, 1000));

  console.log("7) GET /wire/gpi/payments");
  try {
    const gpi = await api("GET", "/wire/gpi/payments", { token });
    console.log("   gpi:", JSON.stringify(gpi).slice(0, 1000));
  } catch (err) {
    console.warn("   gpi list failed:", err.message, err.data || "");
  }

  console.log("Live wire flow complete.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
