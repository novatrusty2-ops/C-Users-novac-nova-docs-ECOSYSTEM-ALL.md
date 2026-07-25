import { isStablecoin, resolveUsdPrice } from '@/lib/prices'
import { quoteNovaBankSwap } from '@/lib/swap/novaBank'

export interface SwapQuote {
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  feeBps: number
  feeAmount: string
  provider: 'internal' | 'nova-bank'
  rate: number
  marketId?: string
  httpStatus?: number
}

export {
  quoteNovaBankSwap,
  fetchSwapMarkets,
  findMarketId,
  NOVA_BANK_SWAP_API,
} from '@/lib/swap/novaBank'

const SWAP_FEE_BPS = 30

export interface QuoteSwapOptions {
  coingeckoFromId?: string
  coingeckoToId?: string
  /** Skip Nova Bank production quote (tests / offline). */
  preferInternal?: boolean
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

  // Prefer Nova Bank production / swap-bridge (HTTP 200) when a market exists.
  const skipLive =
    options.preferInternal === true ||
    import.meta.env.VITE_SWAP_INTERNAL_ONLY === '1' ||
    import.meta.env.MODE === 'test'
  if (!skipLive) {
    try {
      const live = await quoteNovaBankSwap(fromSym, toSym, amount, {
        allow201: import.meta.env.VITE_SWAP_ALLOW_201 === '1',
      })
      const rate =
        Number(live.amountOut) / Math.max(Number(live.amountIn), 1e-12)
      return {
        fromSymbol: fromSym,
        toSymbol: toSym,
        amountIn: live.amountIn,
        amountOut: live.amountOut,
        feeBps: SWAP_FEE_BPS,
        feeAmount: live.fee ?? '0',
        provider: 'nova-bank',
        rate,
        marketId: live.marketId,
        httpStatus: live.httpStatus,
      }
    } catch {
      /* fall through to internal oracle quote */
    }
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
