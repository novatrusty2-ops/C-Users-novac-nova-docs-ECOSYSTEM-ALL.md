import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import {
  assertAdminKey,
  WalletIntegrityService,
} from './wallet-integrity.service';

@Controller('admin/wallets')
export class WalletIntegrityController {
  constructor(private readonly wallets: WalletIntegrityService) {}

  /**
   * POST /api/v1/admin/wallets/repair
   * Scans accounts with balance > 0 and creates missing wallets.
   */
  @Post('repair')
  async repair(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body()
    body?: {
      onlyWithBalance?: boolean;
      accountNumbers?: string[];
    },
  ) {
    assertAdminKey(adminKey, process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY);
    return this.wallets.repairMissingWallets({
      onlyWithBalance: body?.onlyWithBalance,
      accountNumbers: body?.accountNumbers,
    });
  }

  /**
   * GET /api/v1/admin/wallets/health
   */
  @Get('health')
  async health(@Headers('x-admin-key') adminKey: string | undefined) {
    assertAdminKey(adminKey, process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY);
    return this.wallets.health();
  }
}
