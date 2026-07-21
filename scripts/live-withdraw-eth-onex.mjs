#!/usr/bin/env node
/**
 * Withdraw Nova Bank ETH (OneX / chain 138) to an external 0x wallet.
 *
 * Env:
 *   NOVA_BANK_EMAIL or NOVA_BANK_TOKEN
 *   ETH_TO_ADDRESS   (required) 0x…
 *   ETH_AMOUNT       (default: full ETH vault available)
 *   SWAP_LIVE=1      actually POST /onex/wallet/withdraw
 */

import { randomUUID } from "node:crypto";

const BASE =
  process.env.NOVA_BANK_API_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";

const LIVE = process.env.SWAP_LIVE === "1";
const TO = process.env.ETH_TO_ADDRESS || "";

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

function pickAccessToken(p) {
  return (
    p?.accessToken ||
    p?.token ||
    p?.tokens?.accessToken ||
    p?.tokens?.access_token ||
    null
  );
}

async function authenticate() {
  if (process.env.NOVA_BANK_TOKEN) return process.env.NOVA_BANK_TOKEN;
  const email = process.env.NOVA_BANK_EMAIL;
  if (!email) throw new Error("NOVA_BANK_TOKEN or NOVA_BANK_EMAIL required");
  const body = { email };
  if (process.env.NOVA_BANK_PIN) body.pin = process.env.NOVA_BANK_PIN;
  const { data } = await api("POST", "/auth/start", { body });
  const token = pickAccessToken(data);
  if (!token) throw new Error("auth/start missing token");
  return token;
}

async function main() {
  if (!/^0x[a-fA-F0-9]{40}$/.test(TO)) {
    throw new Error("Set ETH_TO_ADDRESS to a valid 0x address");
  }

  console.log("Nova Bank OneX ETH withdraw");
  console.log(`to=${TO}`);
  console.log(`mode=${LIVE ? "LIVE" : "PLAN"}`);

  const token = await authenticate();
  const { data: accounts } = await api("GET", "/accounts", { token });
  const list = Array.isArray(accounts) ? accounts : [];
  const eth = list.find((a) => a.currency === "ETH");
  if (!eth) throw new Error("ETH vault not found");

  const { data: swapBals } = await api("GET", "/swap/balances", { token });
  const swapEth = (swapBals || []).find((b) => b.currency === "ETH");

  const amount = process.env.ETH_AMOUNT || eth.available;
  console.log("vault ETH", eth.available, eth.id);
  console.log("swap ETH", swapEth?.available);
  console.log("withdraw amount", amount);

  const { data: onex } = await api("GET", "/onex/status", { token });
  console.log("onex", {
    chainId: onex.chainId,
    provider: onex.provider,
    mode: onex.mode,
    rpcUrl: onex.rpcUrl,
  });

  if (!LIVE) {
    console.log("execute skipped (set SWAP_LIVE=1)");
    return;
  }

  const { status, data } = await api("POST", "/onex/wallet/withdraw", {
    token,
    body: { accountId: eth.id, amount: String(amount), toAddress: TO },
    idempotencyKey: randomUUID(),
  });
  console.log("withdraw", status, JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2).slice(0, 1500));
  process.exit(1);
});
