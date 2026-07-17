import { AccountRow, WalletIntegrityStore, WalletRow } from './store.interface';

export const ACCOUNT_NUMBER_RE = /^\d{4}$/;
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RepairResult = {
  created: number;
  skipped: number;
  errors: Array<{ accountId: string; accountNumber: string; error: string }>;
};

export type WalletHealth = {
  totalAccounts: number;
  accountsWithBalance: number;
  walletsCreated: number;
  missingWallets: number;
  missingAccountIds: string[];
  walletService: 'running' | 'stopped';
};

export async function resolveAccount(
  store: WalletIntegrityStore,
  fromAccountId: string,
): Promise<AccountRow | null> {
  const id = (fromAccountId || '').trim();
  if (ACCOUNT_NUMBER_RE.test(id)) {
    return store.findAccountByNumber(id);
  }
  if (UUID_RE.test(id)) {
    return store.findAccountById(id);
  }
  return null;
}

export async function ensureSourceWallet(
  store: WalletIntegrityStore,
  fromAccountId: string,
  userId: string,
  onAutoCreate?: (account: AccountRow) => void,
): Promise<WalletRow> {
  const account = await resolveAccount(store, fromAccountId);
  if (!account || account.userId !== userId) {
    throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  }
  let wallet = await store.findWalletById(account.id);
  if (!wallet) {
    onAutoCreate?.(account);
    wallet = await store.createWalletFromAccount(account);
  }
  return wallet;
}

export async function repairMissingWallets(
  store: WalletIntegrityStore,
  options?: { onlyWithBalance?: boolean; accountNumbers?: string[] },
): Promise<RepairResult> {
  const onlyWithBalance = options?.onlyWithBalance !== false;
  const result: RepairResult = { created: 0, skipped: 0, errors: [] };

  let accounts: AccountRow[];
  if (options?.accountNumbers?.length) {
    accounts = [];
    for (const n of options.accountNumbers) {
      const row = await store.findAccountByNumber(n);
      if (row) accounts.push(row);
      else {
        result.errors.push({
          accountId: '',
          accountNumber: n,
          error: 'Account not found in registry',
        });
      }
    }
  } else {
    accounts = await store.listAccounts();
  }

  for (const account of accounts) {
    try {
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
    } catch (err) {
      result.errors.push({
        accountId: account.id,
        accountNumber: account.accountNumber,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return result;
}

export async function walletHealth(
  store: WalletIntegrityStore,
): Promise<WalletHealth> {
  const accounts = await store.listAccounts();
  const walletsCreated = await store.countWallets();
  const healthy = await store.isWalletServiceHealthy();
  const accountsWithBalance = accounts.filter(
    (a) => Number(a.available || '0') > 0,
  );
  const missingAccountIds: string[] = [];
  for (const account of accountsWithBalance) {
    if (!(await store.findWalletById(account.id))) {
      missingAccountIds.push(account.accountNumber);
    }
  }
  return {
    totalAccounts: accounts.length,
    accountsWithBalance: accountsWithBalance.length,
    walletsCreated,
    missingWallets: missingAccountIds.length,
    missingAccountIds,
    walletService: healthy ? 'running' : 'stopped',
  };
}
