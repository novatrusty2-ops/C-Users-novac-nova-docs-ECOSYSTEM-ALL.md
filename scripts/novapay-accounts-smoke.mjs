#!/usr/bin/env node
/**
 * Smoke-test all configured NovaPay settlement accounts via sandbox receive.
 *
 *   npm run test:novapay-accounts
 */

const BASE =
  process.env.NOVAPAY_SANDBOX_BASE?.replace(/\/$/, "") ||
  "https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox";

const ACCOUNTS = [
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
    routingNumber: "084009519",
  },
];

async function receive(account) {
  const stamp = Date.now().toString(36);
  const body = {
    transactionType: "payout",
    amount: "50.00",
    currency: account.currency,
    reference: `NOVA-ACCT-${account.id}-${stamp}`,
    beneficiaryName: account.accountHolder,
    beneficiaryIban: account.beneficiaryIban,
    beneficiarySwift: account.beneficiarySwift,
  };
  const res = await fetch(`${BASE}/receive`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data, reference: body.reference };
}

async function main() {
  console.log(`NovaPay 3-account smoke → ${BASE}\n`);
  let failed = 0;
  for (const account of ACCOUNTS) {
    const result = await receive(account);
    const txn = result.data?.transactionId || "";
    if (result.ok && result.data?.accepted) {
      console.log(
        `OK  ${account.id} (${account.currency}) ${result.status} ${txn}`,
      );
    } else {
      failed++;
      console.error(
        `FAIL ${account.id} (${result.status}) ${JSON.stringify(result.data)}`,
      );
    }
  }
  if (failed) {
    console.error(`\n${failed} account(s) failed`);
    process.exit(1);
  }
  console.log("\nAll 3 NovaPay business accounts sandbox-ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
