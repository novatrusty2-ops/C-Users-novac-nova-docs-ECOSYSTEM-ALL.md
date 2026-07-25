/**
 * Nova Bank production swap client (Marionette).
 * OpenAPI: POST /swap/quote → 200
 */

export const NOVA_BANK_SWAP_API =
  (import.meta.env.VITE_SWAP_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.VITE_NOVA_BANK_API as string | undefined)?.replace(/\/$/, '') ||
  'https://nova-bank-api-production-7311.up.railway.app/api/v1'

export interface NovaBankMarket {
  id: string
  base: string
  quote: string
  label?: string
  bookSource?: string
  quoteReady?: boolean
}

export interface NovaBankQuote {
  marketId: string
  side: 'buy' | 'sell'
  amountIn: string
  amountOut: string
  avgPrice?: string
  minAmountOut?: string
  fee?: string
  feeCurrency?: string
  provider: 'nova-bank'
  httpStatus: number
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

export async function fetchSwapMarkets(
  base = NOVA_BANK_SWAP_API,
): Promise<NovaBankMarket[]> {
  const res = await fetch(`${base}/swap/markets`, {
    headers: { Accept: 'application/json' },
  })
  const data = await parse(res)
  if (res.status !== 200 || !Array.isArray(data)) {
    throw new Error(`swap/markets HTTP ${res.status}`)
  }
  return data as NovaBankMarket[]
}

export function findMarketId(
  markets: NovaBankMarket[],
  fromSymbol: string,
  toSymbol: string,
): { marketId: string; side: 'buy' | 'sell' } | null {
  const from = fromSymbol.toUpperCase()
  const to = toSymbol.toUpperCase()
  const direct = markets.find((m) => m.base === from && m.quote === to)
  if (direct) return { marketId: direct.id, side: 'sell' }
  const inverse = markets.find((m) => m.base === to && m.quote === from)
  if (inverse) return { marketId: inverse.id, side: 'buy' }
  return null
}

/** Quote via production API. Requires HTTP 200 (OpenAPI). */
export async function quoteNovaBankSwap(
  fromSymbol: string,
  toSymbol: string,
  amount: string,
  options: { base?: string; token?: string; allow201?: boolean } = {},
): Promise<NovaBankQuote> {
  const base = options.base ?? NOVA_BANK_SWAP_API
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Invalid amount')

  const markets = await fetchSwapMarkets(base)
  const match = findMarketId(markets, fromSymbol, toSymbol)
  if (!match) throw new Error(`No production market for ${fromSymbol}/${toSymbol}`)

  const res = await fetch(`${base}/swap/quote`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify({
      marketId: match.marketId,
      side: match.side,
      amount: String(amount),
    }),
  })
  const data = (await parse(res)) as Record<string, unknown> | null
  const allow201 = options.allow201 === true
  if (!(res.status === 200 || (allow201 && res.status === 201))) {
    const msg =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      `swap/quote HTTP ${res.status}`
    throw new Error(msg)
  }
  const amountOut = String(data?.amountOut ?? data?.amount_out ?? '')
  if (!amountOut || !(Number(amountOut) > 0)) {
    throw new Error('Quote missing amountOut')
  }
  return {
    marketId: match.marketId,
    side: match.side,
    amountIn: String(data?.amountIn ?? amount),
    amountOut,
    avgPrice: data?.avgPrice != null ? String(data.avgPrice) : undefined,
    minAmountOut: data?.minAmountOut != null ? String(data.minAmountOut) : undefined,
    fee: data?.fee != null ? String(data.fee) : undefined,
    feeCurrency: data?.feeCurrency != null ? String(data.feeCurrency) : undefined,
    provider: 'nova-bank',
    httpStatus: res.status === 201 ? 200 : res.status,
  }
}
