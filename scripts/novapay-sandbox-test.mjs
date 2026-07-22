#!/usr/bin/env node
/**
 * Connect + exercise NovaPay sandbox on Nova Bank API.
 *
 * Flow: status → manifest → receive → send → events
 * Auth: none (sandbox). No live funds.
 *
 *   npm run test:novapay
 *   NOVAPAY_SANDBOX_BASE=… node scripts/novapay-sandbox-test.mjs
 */

const BASE =
  process.env.NOVAPAY_SANDBOX_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox";

const stamp = Date.now().toString(36);

async function api(method, path, body) {
  const url = `${BASE}${path}`;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
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
  return { status: res.status, ok: res.ok, data, url };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function logStep(name, result) {
  const id =
    result.data?.transactionId ||
    result.data?.reference ||
    result.data?.partner ||
    "";
  console.log(`${result.ok ? "OK" : "FAIL"}  ${name} (${result.status})${id ? ` ${id}` : ""}`);
}

async function main() {
  console.log(`NovaPay sandbox test → ${BASE}\n`);

  const status = await api("GET", "/status");
  logStep("status", status);
  assert(status.ok, `status HTTP ${status.status}`);
  assert(status.data?.partner === "novapay", "partner != novapay");
  assert(status.data?.enabled === true, "enabled != true");
  assert(status.data?.configured === true, "configured != true");

  const manifest = await api("GET", "/manifest");
  logStep("manifest", manifest);
  assert(manifest.ok, `manifest HTTP ${manifest.status}`);
  assert(manifest.data?.partner, "manifest missing partner");
  const sample = manifest.data?.payloadSample || {
    transactionType: "payout",
    amount: "10000.00",
    currency: "EUR",
    beneficiaryName: "Sandbox Beneficiary",
    beneficiaryIban: "LT823250062405612558",
    beneficiarySwift: "REVOLT21",
  };

  const receiveRef = `NOVA-NOVAPAY-TEST-${stamp}`;
  const receiveBody = {
    ...sample,
    reference: receiveRef,
    transactionType: sample.transactionType || "payout",
    amount: String(sample.amount ?? "10000.00"),
    currency: (sample.currency || "EUR").toUpperCase(),
  };
  const receive = await api("POST", "/receive", receiveBody);
  logStep("receive", receive);
  assert(receive.ok, `receive HTTP ${receive.status}: ${JSON.stringify(receive.data)}`);
  assert(receive.data?.accepted === true, "receive not accepted");
  assert(receive.data?.sandbox === true, "receive not sandbox");
  assert(
    String(receive.data?.transactionId || "").startsWith("NOVA-PAY-SANDBOX-"),
    `unexpected receive transactionId: ${receive.data?.transactionId}`,
  );

  const sendRef = `NOVA-TO-NOVAPAY-${stamp}`;
  const sendBody = {
    transactionType: "payout",
    amount: "1000.00",
    currency: "EUR",
    reference: sendRef,
  };
  const send = await api("POST", "/send", sendBody);
  logStep("send", send);
  assert(send.ok, `send HTTP ${send.status}: ${JSON.stringify(send.data)}`);
  assert(
    send.data?.status === "completed" || send.data?.accepted === true,
    `send not completed: ${JSON.stringify(send.data)}`,
  );

  const events = await api("GET", "/events");
  logStep("events", events);
  assert(events.ok, `events HTTP ${events.status}`);
  const rows = Array.isArray(events.data)
    ? events.data
    : Array.isArray(events.data?.events)
      ? events.data.events
      : Array.isArray(events.data?.items)
        ? events.data.items
        : [];
  assert(rows.length > 0, "events empty");
  const refs = new Set(
    rows.map((e) => e.reference || e.body?.reference || e.payload?.reference).filter(Boolean),
  );
  const hasReceive = [...refs].some((r) => String(r).includes(receiveRef)) ||
    rows.some((e) => String(e.transactionId || "").includes(receive.data.transactionId));
  const hasSend =
    [...refs].some((r) => String(r).includes(sendRef)) ||
    rows.some(
      (e) =>
        e.direction === "outbound" ||
        String(e.transactionId || "").startsWith("NOVA-PAY-OUT-"),
    );
  assert(hasReceive || hasSend, `events missing our refs; saw ${rows.length} rows`);

  console.log("\nNovaPay ↔ Nova Bank sandbox connect test PASSED");
  console.log(
    JSON.stringify(
      {
        receiveTransactionId: receive.data.transactionId,
        sendStatus: send.data?.status || send.data?.accepted,
        eventCount: rows.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("\nNovaPay sandbox test FAILED:", err.message || err);
  process.exit(1);
});
