import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { PouchpayCalldataService, type QuoteInput } from './calldata.service'

/**
 * PouchPay-compatible quote / routes endpoints.
 *
 * When mounted on a host without a global `api/v1` prefix (wallet style),
 * these match production:
 *   POST /v0/quote
 *   POST /v1/quote
 *   POST /v1/advanced/routes
 *
 * On Nova Bank (`setGlobalPrefix('api/v1')`) they become:
 *   POST /api/v1/v0/quote
 *   POST /api/v1/v1/quote
 *   POST /api/v1/v1/advanced/routes
 *
 * Prefer markets/quote for Bank clients; use this controller for wallet-shaped APIs.
 */
@Controller()
export class PouchpayRoutesController {
  constructor(private readonly calldata: PouchpayCalldataService) {}

  @Post(['v0/quote', 'v1/quote'])
  @HttpCode(HttpStatus.OK)
  async quote(@Body() body: QuoteInput) {
    return this.calldata.quoteWithOptionalBridge(body)
  }

  @Post('v1/advanced/routes')
  @HttpCode(HttpStatus.OK)
  async routes(@Body() body: QuoteInput) {
    const quote = await this.calldata.quoteWithOptionalBridge(body)
    return {
      routes: [this.calldata.toAdvancedRoute(quote)],
      status: 'green',
      color: 'green',
      httpStatus: 200,
      ok: true,
      appVersion: '1.9.5',
      versionCode: 31,
    }
  }
}
