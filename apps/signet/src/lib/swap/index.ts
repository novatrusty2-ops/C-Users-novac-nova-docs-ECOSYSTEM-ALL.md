import { isStablecoin, resolveUsdPrice } from '@/lib/prices'

export interface SwapQuote {
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  feeBps: number
  feeAmount: string
  provider: 'internal' | '1inch'
  rate: number
}

const SWAP_FEE_BPS = 30

export interface QuoteSwapOptions {
  coingeckoFromId?: string
  coingeckoToId?: string
  prefer1inch?: boolean
}

/** Optional 1inch stub — returns null when unavailable */
export async function quote1inchStub(
  _from: string,
  _to: string,
  _amount: string,
): Promise<SwapQuote | null> {
  return null
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

  if (options.prefer1inch) {
    const inch = await quote1inchStub(fromSym, toSym, amount)
    if (inch) return inch
  }

  if (isStablecoin(fromSym) && isStablecoin(toSym)) {
    const fee = (amountNum * SWAP_FEE_BPS) / 10_000
    const out = amountNum - fee
    return {
      fromSymbol: fromSym,
      toSymbol: toSym,
      amountIn: amount,
      amountOut: out.toFixed(6).replace(/\.?0+$/, ''),
      feeBps: SWAP_FEE_BPS,
      feeAmount: fee.toFixed(6).replace(/\.?0+$/, ''),
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
    amountOut: out.toFixed(6).replace(/\.?0+$/, ''),
    feeBps: SWAP_FEE_BPS,
    feeAmount: fee.toFixed(6).replace(/\.?0+$/, ''),
    provider: 'internal',
    rate,
  }
}

export { SWAP_FEE_BPS }
