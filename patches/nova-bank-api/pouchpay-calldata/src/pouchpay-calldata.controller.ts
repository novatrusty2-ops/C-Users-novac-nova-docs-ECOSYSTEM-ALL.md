import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { PouchpayCalldataService, type QuoteInput } from './calldata.service'

/**
 * Drop-in override for ALLTRA / PouchPay market quotes.
 * Builds UniswapV2 callData locally (no bridge required).
 * Optionally proxies to POUCHPAY_BRIDGE_URL when set.
 */
@Controller('alltra-chain/markets')
export class PouchpayCalldataController {
  constructor(private readonly calldata: PouchpayCalldataService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  async quote(@Body() body: QuoteInput) {
    return this.calldata.quoteWithOptionalBridge(body)
  }
}
