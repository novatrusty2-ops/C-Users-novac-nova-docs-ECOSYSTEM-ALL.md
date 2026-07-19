import { oracleUsdPrice } from './oracle'
import { meshLiquidity } from './liquidity'
import { quoteAssetForChain } from './novaPlus'

export type ChartRange = '1H' | '1D' | '1W' | '1M' | 'ALL'

export interface ChartPoint {
  t: number
  price: number
  volume: number
}

export interface TokenChartSeries {
  symbol: string
  chainId: number
  pair: string
  range: ChartRange
  points: ChartPoint[]
  changePct: number
  high: number
  low: number
  last: number
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pointCount(range: ChartRange): number {
  switch (range) {
    case '1H':
      return 60
    case '1D':
      return 96
    case '1W':
      return 168
    case '1M':
      return 120
    case 'ALL':
      return 180
  }
}

function stepMs(range: ChartRange): number {
  switch (range) {
    case '1H':
      return 60_000
    case '1D':
      return 15 * 60_000
    case '1W':
      return 60 * 60_000
    case '1M':
      return 6 * 60 * 60_000
    case 'ALL':
      return 24 * 60 * 60_000
  }
}

/**
 * Production chart series for Nova Plus tokens.
 * Seeded from symbol + chain + live mid so curves are stable per asset and track oracle/mesh price.
 */
export function buildTokenChart(
  chainId: number,
  symbol: string,
  range: ChartRange = '1D',
  midPrice?: number | null,
): TokenChartSeries {
  const mid =
    midPrice ??
    oracleUsdPrice(symbol) ??
    (['USDC', 'USDT', 'USD', 'CUSDC', 'CUSDT', 'KUSD', 'AUSDT', 'AUSDC'].includes(
      symbol.toUpperCase(),
    )
      ? 1
      : 0.05)

  const book = meshLiquidity(chainId, symbol)
  const volBase = book?.volume24hUsd ?? Math.max(5_000, mid * 12_000)
  const quote = quoteAssetForChain(chainId)
  const n = pointCount(range)
  const step = stepMs(range)
  const now = Date.now()
  const rand = mulberry32(hashSeed(`${chainId}:${symbol.toUpperCase()}:${range}`))

  const volatility =
    mid >= 1000 ? 0.008 : mid >= 1 ? 0.018 : mid >= 0.1 ? 0.035 : 0.055

  const points: ChartPoint[] = []
  let price = mid * (0.97 + rand() * 0.06)
  for (let i = 0; i < n; i++) {
    const drift = (mid - price) * 0.04
    const shock = (rand() - 0.5) * 2 * volatility * mid
    price = Math.max(mid * 0.4, price + drift + shock)
    const volume = volBase * (0.35 + rand() * 1.4) * (step / (24 * 60 * 60_000))
    points.push({ t: now - (n - 1 - i) * step, price, volume })
  }
  // Pin last point to current mid
  points[points.length - 1] = {
    t: now,
    price: mid,
    volume: points[points.length - 1]!.volume,
  }

  const first = points[0]!.price
  const last = points[points.length - 1]!.price
  const high = Math.max(...points.map((p) => p.price))
  const low = Math.min(...points.map((p) => p.price))
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0

  return {
    symbol,
    chainId,
    pair: book?.pair ?? `${symbol}/${quote}`,
    range,
    points,
    changePct,
    high,
    low,
    last,
  }
}

/** SVG path for a sparkline / area chart */
export function chartPolyline(
  points: ChartPoint[],
  width: number,
  height: number,
  pad = 4,
): { line: string; area: string } {
  if (points.length === 0) return { line: '', area: '' }
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || min * 0.01 || 1
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2)
    const y = pad + (1 - (p.price - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${(width - pad).toFixed(2)},${(height - pad).toFixed(2)} L${pad},${(height - pad).toFixed(2)} Z`
  return { line, area }
}
