import {
  AccountRow,
  WalletIntegrityStore,
  WalletRow,
} from './store.interface';

function walletType(assetClass: AccountRow['assetClass']): string {
  return assetClass === 'crypto' ? 'user_crypto' : 'user_fiat';
}

export class InMemoryWalletIntegrityStore implements WalletIntegrityStore {
  accounts = new Map<string, AccountRow>();
  wallets = new Map<string, WalletRow>();
  healthy = true;

  seedAccount(account: AccountRow, withWallet = true): void {
    this.accounts.set(account.id, account);
    if (withWallet) {
      this.wallets.set(account.id, this.toWallet(account));
    }
  }

  async listAccounts(): Promise<AccountRow[]> {
    return [...this.accounts.values()];
  }

  async findAccountByNumber(accountNumber: string): Promise<AccountRow | null> {
    return (
      [...this.accounts.values()].find((a) => a.accountNumber === accountNumber) ??
      null
    );
  }

  async findAccountById(id: string): Promise<AccountRow | null> {
    return this.accounts.get(id) ?? null;
  }

  async findWalletById(id: string): Promise<WalletRow | null> {
    return this.wallets.get(id) ?? null;
  }

  async createWalletFromAccount(account: AccountRow): Promise<WalletRow> {
    const wallet = this.toWallet(account);
    this.wallets.set(account.id, wallet);
    return wallet;
  }

  async countWallets(): Promise<number> {
    return this.wallets.size;
  }

  async isWalletServiceHealthy(): Promise<boolean> {
    return this.healthy;
  }

  private toWallet(account: AccountRow): WalletRow {
    return {
      id: account.id,
      userId: account.userId,
      type: walletType(account.assetClass),
      assetClass: account.assetClass,
      currency: account.currency,
      label: account.label,
      available: account.available,
      pending: '0',
      accountNumber: account.accountNumber,
      iban: account.iban || '',
      swiftBic: account.swiftBic || '',
      protocol: account.protocol,
      protocolModule: account.protocolModule,
      protocolVersion: account.protocolVersion,
    };
  }
}
