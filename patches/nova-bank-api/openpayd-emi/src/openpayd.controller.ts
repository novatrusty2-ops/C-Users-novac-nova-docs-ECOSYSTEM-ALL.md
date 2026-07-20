import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { assertAdminKey, OpenPaydService } from './openpayd.service';

/**
 * Routes intended under global prefix `/api/v1`:
 * - GET  /openpayd/status
 * - GET  /openpayd/health          (admin)
 * - GET  /openpayd/accounts        (admin)
 * - GET  /openpayd/accounts/default (admin)
 * - POST /webhooks/openpayd        (also works via host POST /webhooks/:provider)
 */
@Controller()
export class OpenPaydController {
  private readonly openpayd: OpenPaydService;

  constructor(openpayd: OpenPaydService) {
    this.openpayd = openpayd;
  }

  /** Public readiness (no secrets). */
  @Get('openpayd/status')
  status() {
    return this.openpayd.getConfigSummary();
  }

  @Get('openpayd/health')
  async health(@Headers('x-admin-key') adminKey: string | undefined) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.openpayd.health();
  }

  @Get('openpayd/accounts')
  async accounts(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Query('currency') currency?: string,
  ) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.openpayd.listAccounts(currency);
  }

  @Get('openpayd/accounts/default')
  async defaultAccount(@Headers('x-admin-key') adminKey: string | undefined) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.openpayd.getDefaultAccount();
  }

  /**
   * Dedicated webhook path. Host may also route
   * POST /api/v1/webhooks/:provider → this handler when provider=openpayd.
   */
  @Post('webhooks/openpayd')
  async webhookOpenpayd(
    @Req() req: { rawBody?: Buffer | string; body?: unknown; headers?: Record<string, string | string[] | undefined> },
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return this.openpayd.handleWebhook({
      rawBody,
      headers: headers ?? req.headers ?? {},
      body,
    });
  }

  /** Optional alias matching Nova OpenAPI POST /webhooks/{provider}. */
  @Post('webhooks/:provider')
  async webhookProvider(
    @Param('provider') provider: string,
    @Req() req: { rawBody?: Buffer | string; body?: unknown; headers?: Record<string, string | string[] | undefined> },
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (provider.toLowerCase() !== 'openpayd') {
      return {
        accepted: false,
        reason: 'unsupported_provider',
        provider,
        hint: 'This OpenPayd patch only handles provider=openpayd',
      };
    }
    const rawBody =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return this.openpayd.handleWebhook({
      rawBody,
      headers: headers ?? req.headers ?? {},
      body,
    });
  }
}
