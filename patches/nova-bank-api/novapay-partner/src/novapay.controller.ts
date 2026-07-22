import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { assertAdminKey, NovaPayService } from './novapay.service';

/**
 * Routes under global prefix `/api/v1`:
 * - GET  /novapay/status
 * - GET  /novapay/health          (admin)
 * - GET  /novapay/events          (admin)
 * - POST /novapay/receive         (admin)
 * - POST /novapay/send            (admin)
 * - POST /webhooks/novapay
 */
@Controller()
export class NovaPayController {
  private readonly novapay: NovaPayService;

  constructor(novapay: NovaPayService) {
    this.novapay = novapay;
  }

  @Get('novapay/status')
  status() {
    return this.novapay.getConfigSummary();
  }

  @Get('novapay/health')
  async health(@Headers('x-admin-key') adminKey: string | undefined) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.novapay.health();
  }

  @Get('novapay/events')
  async events(@Headers('x-admin-key') adminKey: string | undefined) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.novapay.events();
  }

  @Post('novapay/receive')
  async receive(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.novapay.receive(body || {});
  }

  @Post('novapay/send')
  async send(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertAdminKey(
      adminKey,
      process.env.ADMIN_API_KEY || process.env.X_ADMIN_KEY,
    );
    return this.novapay.send(body || {});
  }

  @Post('webhooks/novapay')
  async webhookNovapay(
    @Req()
    req: {
      rawBody?: Buffer | string;
      body?: unknown;
      headers?: Record<string, string | string[] | undefined>;
    },
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return this.novapay.handleWebhook({
      rawBody,
      headers: headers ?? req.headers ?? {},
      body,
    });
  }

  @Post('webhooks/:provider')
  async webhookProvider(
    @Param('provider') provider: string,
    @Req()
    req: {
      rawBody?: Buffer | string;
      body?: unknown;
      headers?: Record<string, string | string[] | undefined>;
    },
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (provider.toLowerCase() !== 'novapay') {
      return {
        accepted: false,
        reason: 'unsupported_provider',
        provider,
        hint: 'This NovaPay patch only handles provider=novapay',
      };
    }
    const rawBody =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return this.novapay.handleWebhook({
      rawBody,
      headers: headers ?? req.headers ?? {},
      body,
    });
  }
}
