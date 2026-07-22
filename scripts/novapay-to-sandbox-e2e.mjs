#!/usr/bin/env node
/**
 * Nova Bank → NovaPay sandbox e2e (no live funds).
 *
 * Flow:
 *   partners/status → sandbox status → manifest
 *   → send (Nova → NovaPay) → receive (into settlement accounts)
 *   → events → optional bridge /api/v1/novapay/*
 *
 *   npm run test:novapay:to
 *   NOVAPAY_BRIDGE_URL=http://127.0.0.1:4080 npm run test:novapay:to
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAILWAY =
  process.env.NOVA_BANK_API?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1";
const SANDBOX =
  process.env.NOVAPAY_SANDBOX_BASE?.replace(/\/$/, "") ||
  `${RAILWAY}/partners/novapay/sandbox`;
const BRIDGE = (process.env.NOVAPAY_BRIDGE_URL || "").replace(/\/$/, "");
const ARTIFACT_DIR =
  process.env.NOVAPAY_TEST_ARTIFACT_DIR || "/opt/cursor/artifacts";

const stamp = Date.now().toString(36);
const results = [];

const SETTLEMENT = [
  {
    id: "revolut-eur-total-design",
    accountHolder: "TOTAL DESIGN S.R.L.",
    currency: "EUR",
    beneficiaryIban: "LT163250079884101461",
    beneficiarySwift: "REVOLT21",
  },
  {
    id: "wise-eur-global-luxury",
    accountHolder: "GLOBAL LUXURY SRLS",
    currency: "EUR",
    beneficiaryIban: "BE18905804591765",
    beneficiarySwift: "TRWIBEB1XXX",
  },
  {
    id: "wise-usd-global-luxury",
    accountHolder: "GLOBAL LUXURY SRLS",
    currency: "USD",
    beneficiaryIban: "515842398651352",
    beneficiarySwift: "TRWIUS35XXX",
  },
];

async function api(method, url, body) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 400) };
  }
  return { status: res.status, ok: res.ok, data, url, method };
}

function record(name, pass, detail) {
  const row = { name, pass, ...detail };
  results.push(row);
  console.log(`${pass ? "OK" : "FAIL"}  ${name}${detail?.note ? ` — ${detail.note}` : ""}`);
  return pass;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("Nova Bank → NovaPay sandbox e2e");
  console.log(`  partners API: ${RAILWAY}`);
  console.log(`  sandbox:      ${SANDBOX}`);
  if (BRIDGE) console.log(`  bridge:       ${BRIDGE}`);
  console.log("");

  // 1) partners/status — NovaPay wired
  const partners = await api("GET", `${RAILWAY}/partners/status`);
  const np = partners.data?.novapay;
  assert(
    record(
      "partners/status novapay",
      partners.ok && np?.enabled === true && np?.configured === true,
      {
        status: partners.status,
        note: np ? `${np.partner}/${np.mode}` : "missing novapay",
      },
    ),
    "NovaPay not wired on partners/status",
  );

  // 2) sandbox status
  const status = await api("GET", `${SANDBOX}/status`);
  assert(
    record("sandbox status", status.ok && status.data?.partner === "novapay", {
      status: status.status,
      note: `enabled=${status.data?.enabled}`,
    }),
    "sandbox status failed",
  );

  // 3) manifest
  const manifest = await api("GET", `${SANDBOX}/manifest`);
  assert(
    record("sandbox manifest", manifest.ok && Boolean(manifest.data?.partner), {
      status: manifest.status,
      note: manifest.data?.partner || "",
    }),
    "manifest failed",
  );

  // 4) send — Nova → NovaPay
  const sendRef = `NOVA-TO-NOVAPAY-${stamp}`;
  const send = await api("POST", `${SANDBOX}/send`, {
    transactionType: "payout",
    amount: "25.00",
    currency: "EUR",
    reference: sendRef,
  });
  const sendOk =
    send.ok &&
    (send.data?.status === "completed" || send.data?.accepted === true);
  assert(
    record("send Nova→NovaPay", sendOk, {
      status: send.status,
      note: send.data?.transactionId || send.data?.status || "",
      reference: sendRef,
      response: send.data,
    }),
    `send failed: ${JSON.stringify(send.data)}`,
  );

  // 5) receive — into each settlement account
  const receiveIds = [];
  for (const account of SETTLEMENT) {
    const ref = `NOVA-RECV-${account.id}-${stamp}`;
    const receive = await api("POST", `${SANDBOX}/receive`, {
      transactionType: "payout",
      amount: "50.00",
      currency: account.currency,
      reference: ref,
      beneficiaryName: account.accountHolder,
      beneficiaryIban: account.beneficiaryIban,
      beneficiarySwift: account.beneficiarySwift,
    });
    const ok = receive.ok && receive.data?.accepted === true;
    if (ok) receiveIds.push(receive.data.transactionId);
    assert(
      record(`receive ${account.id}`, ok, {
        status: receive.status,
        note: receive.data?.transactionId || "",
        reference: ref,
      }),
      `receive ${account.id} failed: ${JSON.stringify(receive.data)}`,
    );
  }

  // 6) events
  const events = await api("GET", `${SANDBOX}/events`);
  const rows = Array.isArray(events.data)
    ? events.data
    : Array.isArray(events.data?.events)
      ? events.data.events
      : Array.isArray(events.data?.items)
        ? events.data.items
        : [];
  const sawSend =
    rows.some((e) => String(e.reference || e.body?.reference || "").includes(sendRef)) ||
    rows.some((e) => String(e.transactionId || "").startsWith("NOVA-PAY-OUT-"));
  assert(
    record("events", events.ok && rows.length > 0 && sawSend, {
      status: events.status,
      note: `${rows.length} events; sendRef=${sawSend}`,
    }),
    "events missing send activity",
  );

  // 7) optional bridge Nest-shaped routes
  if (BRIDGE) {
    const bStatus = await api("GET", `${BRIDGE}/api/v1/novapay/status`);
    assert(
      record("bridge status", bStatus.ok && bStatus.data?.bridge === true, {
        status: bStatus.status,
        note: bStatus.data?.bridgeService || "",
      }),
      "bridge status failed",
    );
    const bSend = await api("POST", `${BRIDGE}/api/v1/novapay/send`, {
      transactionType: "payout",
      amount: "10.00",
      currency: "EUR",
      reference: `NOVA-BRIDGE-TO-NOVAPAY-${stamp}`,
    });
    assert(
      record(
        "bridge send Nova→NovaPay",
        bSend.ok && (bSend.data?.status === "completed" || bSend.data?.accepted === true || bSend.data?.bridge === true),
        {
          status: bSend.status,
          note: bSend.data?.transactionId || "",
        },
      ),
      `bridge send failed: ${JSON.stringify(bSend.data)}`,
    );
  } else {
    record("bridge (skipped)", true, {
      note: "set NOVAPAY_BRIDGE_URL to include bridge path",
    });
  }

  const summary = {
    ok: true,
    at: new Date().toISOString(),
    sandbox: SANDBOX,
    bridge: BRIDGE || null,
    sendReference: sendRef,
    sendTransactionId: send.data?.transactionId || null,
    receiveTransactionIds: receiveIds,
    eventCount: rows.length,
    steps: results,
  };

  console.log("\nNova Bank → NovaPay sandbox e2e PASSED");
  console.log(
    JSON.stringify(
      {
        sendTransactionId: summary.sendTransactionId,
        receiveCount: receiveIds.length,
        eventCount: rows.length,
        bridge: Boolean(BRIDGE),
      },
      null,
      2,
    ),
  );

  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    const out = join(ARTIFACT_DIR, "novapay-to-sandbox-e2e.json");
    writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`\nArtifact: ${out}`);
  } catch {
    /* artifact dir may be unavailable outside cloud */
  }
}

main().catch((err) => {
  console.error("\nNova Bank → NovaPay sandbox e2e FAILED:", err.message || err);
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    writeFileSync(
      join(ARTIFACT_DIR, "novapay-to-sandbox-e2e.json"),
      `${JSON.stringify({ ok: false, error: String(err.message || err), steps: results }, null, 2)}\n`,
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
