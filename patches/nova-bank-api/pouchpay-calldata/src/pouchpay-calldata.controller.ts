import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common'

/**
 * Drop-in override for ALLTRA / PouchPay market quotes.
 * Proxies to pouchpay-bridge when POUCHPAY_BRIDGE_URL is configured.
 */
@Controller('alltra-chain/markets')
export class PouchpayCalldataController {
  @Post('quote')
  async quote(
    @Body()
    body: {
      tokenIn?: string
      tokenOut?: string
      amountIn?: string
      fromSymbol?: string
      toSymbol?: string
      amount?: string
      recipient?: string
      userAddress?: string
      slippageBps?: number
    },
  ) {
    const bridge = (process.env.POUCHPAY_BRIDGE_URL || '').replace(/\/$/, '')
    if (!bridge) {
      throw new HttpException(
        'POUCHPAY_BRIDGE_URL not set — deploy apps/pouchpay-bridge and configure env',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    const res = await fetch(`${bridge}/v0/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new HttpException(
        data?.message || `pouchpay-bridge HTTP ${res.status}`,
        res.status >= 400 && res.status < 600 ? res.status : HttpStatus.BAD_GATEWAY,
      )
    }
    if (!data?.callData || !Array.isArray(data?.path) || data.path.length < 2) {
      throw new HttpException('PouchPay route missing callData', HttpStatus.BAD_GATEWAY)
    }
    return { ...data, source: data.source || 'pouchpay-bridge' }
  }
}
