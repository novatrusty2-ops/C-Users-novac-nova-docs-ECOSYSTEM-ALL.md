import { oracleUsdPrice } from './oracle'

const STABLECOINS = new Set([
  'USD',
  'USDC',
  'USDT',
  'DAI',
  'BUSD',
  'TUSD',
  'FRAX',
  'LUSD',
  'xDAI',
  'CUSDC',
  'CUSDT',
  'AUSDT',
  'KUSD',
])

const coingeckoCache = new Map<string, { price: number; at: number }>()
const CACHE_MS = 60_000

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
  const sym = symbol.trim().toUpperCase()
  if (isStablecoin(sym)) return 1

  if (coingeckoId) {
    const live = await fetchCoingeckoUsd(coingeckoId)
    if (live != null) return live
  }

  return oracleUsdPrice(sym)
}

export function clearPriceCache(): void {
  coingeckoCache.clear()
}
