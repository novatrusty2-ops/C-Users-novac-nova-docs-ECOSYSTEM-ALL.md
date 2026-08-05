import { isStablecoin, resolveUsdPrice } from '@/lib/prices'
import { trimHumanAmount } from '@/lib/pouchpay/amounts'

export interface SwapQuote {
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  feeBps: number
  feeAmount: string
  provider: 'internal'
  rate: number
}

const SWAP_FEE_BPS = 30

export interface QuoteSwapOptions {
  coingeckoFromId?: string
  coingeckoToId?: string
}

export async function quoteSwap(
  from: string,
  to: string,
  amount: string,
  options: QuoteSwapOptions = {},
): Promise<SwapQuote> {
  const fromSym = from.trim().toUpperCase()
  const toSym = to.trim().toUpperCase()
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Invalid amount')
  if (fromSym === toSym) throw new Error('Same token')

  if (isStablecoin(fromSym) && isStablecoin(toSym)) {
    const fee = (amountNum * SWAP_FEE_BPS) / 10_000
    const out = amountNum - fee
    return {
      fromSymbol: fromSym,
      toSymbol: toSym,
      amountIn: amount,
      amountOut: trimHumanAmount(out.toFixed(6)),
      feeBps: SWAP_FEE_BPS,
      feeAmount: trimHumanAmount(fee.toFixed(6)),
      provider: 'internal',
      rate: 1,
    }
  }

  const [fromUsd, toUsd] = await Promise.all([
    resolveUsdPrice(fromSym, options.coingeckoFromId),
    resolveUsdPrice(toSym, options.coingeckoToId),
  ])
  if (fromUsd == null || toUsd == null || toUsd === 0) {
    throw new Error('Price unavailable')
  }

  const rate = fromUsd / toUsd
  const fee = (amountNum * SWAP_FEE_BPS) / 10_000
  const out = (amountNum - fee) * rate

  return {
    fromSymbol: fromSym,
    toSymbol: toSym,
    amountIn: amount,
    amountOut: trimHumanAmount(out.toFixed(6)),
    feeBps: SWAP_FEE_BPS,
    feeAmount: trimHumanAmount(fee.toFixed(6)),
    provider: 'internal',
    rate,
  }
}

export { SWAP_FEE_BPS }
