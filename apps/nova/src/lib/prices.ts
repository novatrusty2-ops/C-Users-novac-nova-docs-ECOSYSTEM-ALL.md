import { oracleUsdPrice } from './oracle'

const STABLECOINS = new Set([
  'USD',
  'USDC',
  'USDT',
  'DAI',
  'BUSD',
  'AUSDT',
  'AUSDC',
  'CUSDT',
  'CUSDC',
  'KUSD',
  'TUSD',
  'FRAX',
  'USDT-LEGACY',
  'USDT-TRC20',
  'USDT-BNB',
  'NSB-AUSDT',
])

const coingeckoCache = new Map<string, { price: number; at: number }>()
const CACHE_MS = 60_000

/** Map mesh symbols → CoinGecko ids for live quotes */
export const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  BTC: 'bitcoin',
  WBTC: 'bitcoin',
  BNB: 'binancecoin',
  XRP: 'ripple',
  SOL: 'solana',
  TRX: 'tron',
  MATIC: 'matic-network',
  POL: 'matic-network',
  USDC: 'usd-coin',
  USDT: 'tether',
}

export function isStablecoin(symbol: string): boolean {
  return STABLECOINS.has(symbol.trim().toUpperCase())
}

async function fetchCoingeckoUsd(id: string): Promise<number | null> {
  const cached = coingeckoCache.get(id)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.price

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, { usd?: number }>
    const price = data[id]?.usd
    if (typeof price !== 'number' || !Number.isFinite(price)) return null
    coingeckoCache.set(id, { price, at: Date.now() })
    return price
  } catch {
    return null
  }
}

export async function resolveUsdPrice(symbol: string, coingeckoId?: string): Promise<number | null> {
  const sym = symbol.trim()
  const upper = sym.toUpperCase()
  if (isStablecoin(upper)) return 1

  const id = coingeckoId ?? COINGECKO_IDS[upper]
  if (id) {
    const live = await fetchCoingeckoUsd(id)
    if (live != null) return live
  }

  return oracleUsdPrice(sym) ?? oracleUsdPrice(upper)
}

export async function resolveManyUsdPrices(
  symbols: { symbol: string; coingeckoId?: string }[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  await Promise.all(
    symbols.map(async ({ symbol, coingeckoId }) => {
      const p = await resolveUsdPrice(symbol, coingeckoId)
      if (p != null) out.set(symbol.toUpperCase(), p)
    }),
  )
  return out
}

export function clearPriceCache(): void {
  coingeckoCache.clear()
}
