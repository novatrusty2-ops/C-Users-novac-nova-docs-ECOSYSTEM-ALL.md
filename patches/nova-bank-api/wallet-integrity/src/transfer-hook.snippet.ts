/**
 * INTEGRATION SNIPPET — paste into TransfersService.transferByAccount
 * (or call from the controller before the existing debit path).
 *
 * Before:
 *   const wallet = await this.wallets.findById(dto.fromAccountId);
 *   if (!wallet) throw new NotFoundException('Wallet not found');
 *
 * After:
 */
import { WalletIntegrityService } from './wallet-integrity.service';

export async function resolveTransferSourceWallet(opts: {
  walletIntegrity: WalletIntegrityService;
  fromAccountId: string;
  userId: string;
}) {
  // Resolves 4-digit account numbers, enforces ownership, auto-creates
  // missing wallet rows with a warn log.
  return opts.walletIntegrity.ensureSourceWallet(
    opts.fromAccountId,
    opts.userId,
  );
}
