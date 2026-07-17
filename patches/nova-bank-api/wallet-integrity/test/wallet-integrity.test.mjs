/**
 * Standalone tests for wallet integrity core rules (no NestJS required).
 * Mirrors src/core.ts + in-memory.store.ts behavior.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const ACCOUNT_NUMBER_RE = /^\d{4}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class Store {
  constructor() {
    this.accounts = new Map();
    this.wallets = new Map();
    this.healthy = true;
  }
  seed(account, withWallet = true) {
    this.accounts.set(account.id, account);
    if (withWallet) {
      this.wallets.set(account.id, { ...account, type: 'user_fiat', pending: '0' });
    }
  }
  listAccounts = async () => [...this.accounts.values()];
  findAccountByNumber = async (n) =>
    [...this.accounts.values()].find((a) => a.accountNumber === n) ?? null;
  findAccountById = async (id) => this.accounts.get(id) ?? null;
  findWalletById = async (id) => this.wallets.get(id) ?? null;
  createWalletFromAccount = async (account) => {
    const w = { ...account, type: 'user_fiat', pending: '0' };
    this.wallets.set(account.id, w);
    return w;
  };
  countWallets = async () => this.wallets.size;
  isWalletServiceHealthy = async () => this.healthy;
}

async function resolveAccount(store, fromAccountId) {
  const id = (fromAccountId || '').trim();
  if (ACCOUNT_NUMBER_RE.test(id)) return store.findAccountByNumber(id);
  if (UUID_RE.test(id)) return store.findAccountById(id);
  return null;
}

async function ensureSourceWallet(store, fromAccountId, userId) {
  const account = await resolveAccount(store, fromAccountId);
  if (!account || account.userId !== userId) {
    const err = new Error('Wallet not found');
    err.statusCode = 404;
    throw err;
  }
  let wallet = await store.findWalletById(account.id);
  if (!wallet) wallet = await store.createWalletFromAccount(account);
  return wallet;
}

async function repair(store, { onlyWithBalance = true, accountNumbers } = {}) {
  const result = { created: 0, skipped: 0, errors: [] };
  let accounts;
  if (accountNumbers?.length) {
    accounts = [];
    for (const n of accountNumbers) {
      const row = await store.findAccountByNumber(n);
      if (row) accounts.push(row);
      else result.errors.push({ accountNumber: n, error: 'Account not found in registry' });
    }
  } else accounts = await store.listAccounts();

  for (const account of accounts) {
    const balance = Number(account.available || '0');
    if (onlyWithBalance && !(balance > 0)) {
      result.skipped += 1;
      continue;
    }
    if (await store.findWalletById(account.id)) {
      result.skipped += 1;
      continue;
    }
    await store.createWalletFromAccount(account);
    result.created += 1;
  }
  return result;
}

async function health(store) {
  const accounts = await store.listAccounts();
  const withBal = accounts.filter((a) => Number(a.available || '0') > 0);
  const missing = [];
  for (const a of withBal) {
    if (!(await store.findWalletById(a.id))) missing.push(a.accountNumber);
  }
  return {
    totalAccounts: accounts.length,
    accountsWithBalance: withBal.length,
    walletsCreated: await store.countWallets(),
    missingWallets: missing.length,
    missingAccountIds: missing,
    walletService: (await store.isWalletServiceHealthy()) ? 'running' : 'stopped',
  };
}

const OWNER = '309ccd03-ddfc-49fe-8bbd-da1d4185ae51';
const OTHER = '838e759f-47aa-4634-80f5-173f3e1ce2d3';

describe('wallet integrity', () => {
  it('resolves 4-digit account numbers for owned wallets', async () => {
    const store = new Store();
    store.seed({
      id: '52b8cb06-2127-4be4-9cb2-45e071174bdb',
      accountNumber: '9873',
      userId: OWNER,
      currency: 'USD',
      label: 'USD Real Fiat',
      assetClass: 'fiat',
      protocol: 'real',
      available: '100',
    });
    const wallet = await ensureSourceWallet(store, '9873', OWNER);
    assert.equal(wallet.id, '52b8cb06-2127-4be4-9cb2-45e071174bdb');
  });

  it('auto-creates missing wallet on transfer with ownership check', async () => {
    const store = new Store();
    store.seed(
      {
        id: '05a2f2e5-f5e0-4dee-b99f-df1474dc761e',
        accountNumber: '6379',
        userId: OWNER,
        currency: 'EUR',
        label: 'EUR Real Fiat',
        assetClass: 'fiat',
        protocol: 'real',
        available: '50',
      },
      false,
    );
    assert.equal(await store.findWalletById('05a2f2e5-f5e0-4dee-b99f-df1474dc761e'), null);
    const wallet = await ensureSourceWallet(store, '6379', OWNER);
    assert.equal(wallet.accountNumber, '6379');
    assert.ok(await store.findWalletById(wallet.id));
  });

  it('returns Wallet not found for non-owner', async () => {
    const store = new Store();
    store.seed({
      id: 'f21b31c2-14a8-4986-98b4-c6abe1dbdea3',
      accountNumber: '5017',
      userId: OWNER,
      currency: 'USD',
      label: 'USD Local Ledger',
      assetClass: 'fiat',
      protocol: 'offline',
      available: '10',
    });
    await assert.rejects(
      () => ensureSourceWallet(store, '5017', OTHER),
      /Wallet not found/,
    );
  });

  it('repair creates wallets only for accounts with balance > 0', async () => {
    const store = new Store();
    store.seed(
      {
        id: '52b8cb06-2127-4be4-9cb2-45e071174bdb',
        accountNumber: '9873',
        userId: OWNER,
        currency: 'USD',
        label: 'USD Real Fiat',
        assetClass: 'fiat',
        protocol: 'real',
        available: '100',
      },
      false,
    );
    store.seed(
      {
        id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        accountNumber: '1111',
        userId: OWNER,
        currency: 'USD',
        label: 'Empty',
        assetClass: 'fiat',
        protocol: 'offline',
        available: '0',
      },
      false,
    );
    const result = await repair(store);
    assert.equal(result.created, 1);
    assert.equal(result.skipped, 1);
    assert.deepEqual(result.errors, []);
  });

  it('health reports missing account numbers', async () => {
    const store = new Store();
    store.seed(
      {
        id: '52b8cb06-2127-4be4-9cb2-45e071174bdb',
        accountNumber: '9873',
        userId: OWNER,
        currency: 'USD',
        label: 'USD Real Fiat',
        assetClass: 'fiat',
        protocol: 'real',
        available: '100',
      },
      false,
    );
    const h = await health(store);
    assert.equal(h.missingWallets, 1);
    assert.deepEqual(h.missingAccountIds, ['9873']);
    assert.equal(h.walletService, 'running');
  });
});
