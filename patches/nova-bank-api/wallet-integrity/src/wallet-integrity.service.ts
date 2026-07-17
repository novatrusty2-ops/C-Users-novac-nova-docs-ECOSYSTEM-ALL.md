import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ensureSourceWallet,
  repairMissingWallets,
  RepairResult,
  walletHealth,
  WalletHealth,
} from './core';
import { WALLET_INTEGRITY_STORE, WalletIntegrityStore } from './store.interface';

@Injectable()
export class WalletIntegrityService {
  private readonly logger = new Logger(WalletIntegrityService.name);

  constructor(
    @Inject(WALLET_INTEGRITY_STORE)
    private readonly store: WalletIntegrityStore,
  ) {}

  async hasWallet(accountId: string): Promise<boolean> {
    return Boolean(await this.store.findWalletById(accountId));
  }

  async ensureSourceWallet(fromAccountId: string, userId: string) {
    try {
      return await ensureSourceWallet(
        this.store,
        fromAccountId,
        userId,
        (account) => {
          this.logger.warn(
            `Auto-creating missing wallet for account ${account.accountNumber} (${account.id}) on transfer`,
          );
        },
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'Wallet not found') {
        throw new NotFoundException('Wallet not found');
      }
      throw err;
    }
  }

  async repairMissingWallets(options?: {
    onlyWithBalance?: boolean;
    accountNumbers?: string[];
  }): Promise<RepairResult> {
    const result = await repairMissingWallets(this.store, options);
    if (result.created > 0) {
      this.logger.warn(`Wallet repair created ${result.created} wallet(s)`);
    }
    return result;
  }

  async health(): Promise<WalletHealth> {
    return walletHealth(this.store);
  }

  async enrichAccountLookup<T extends Record<string, unknown>>(
    account: T & { id?: string; accountNumber?: string },
  ): Promise<T & { hasWallet: boolean }> {
    let accountId = typeof account.id === 'string' ? account.id : undefined;
    if (!accountId && typeof account.accountNumber === 'string') {
      const row = await this.store.findAccountByNumber(account.accountNumber);
      accountId = row?.id;
    }
    const hasWallet = accountId ? await this.hasWallet(accountId) : false;
    return { ...account, hasWallet };
  }
}

export function assertAdminKey(
  provided: string | undefined,
  expected: string | undefined,
): void {
  if (!expected || !provided || provided !== expected) {
    throw new ForbiddenException('Valid X-Admin-Key or VVIP wallet required');
  }
}
