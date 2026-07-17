export type AccountRow = {
  id: string;
  accountNumber: string;
  userId: string;
  currency: string;
  label: string;
  assetClass: 'fiat' | 'crypto';
  protocol: string;
  protocolModule?: string;
  protocolVersion?: string;
  iban?: string;
  swiftBic?: string;
  /** Decimal string balance available for transfer */
  available: string;
};

export type WalletRow = {
  id: string;
  userId: string;
  type: string;
  assetClass: 'fiat' | 'crypto';
  currency: string;
  label: string;
  available: string;
  pending: string;
  accountNumber: string;
  iban: string;
  swiftBic: string;
  protocol: string;
  protocolModule?: string;
  protocolVersion?: string;
};

/**
 * Host adapter — bind these methods to TypeORM/Prisma in the nova API.
 */
export interface WalletIntegrityStore {
  listAccounts(): Promise<AccountRow[]>;
  findAccountByNumber(accountNumber: string): Promise<AccountRow | null>;
  findAccountById(id: string): Promise<AccountRow | null>;
  findWalletById(id: string): Promise<WalletRow | null>;
  createWalletFromAccount(account: AccountRow): Promise<WalletRow>;
  countWallets(): Promise<number>;
  isWalletServiceHealthy(): Promise<boolean>;
}

export const WALLET_INTEGRITY_STORE = Symbol('WALLET_INTEGRITY_STORE');
