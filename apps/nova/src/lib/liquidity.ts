import { oracleUsdPrice } from './oracle'
import { resolveUsdPrice } from './prices'
import { isMeshStable } from './tokenCapabilities'
import { scoreSentiment, type MarketSentiment } from './sentiment'

export type PriceSource = 'peg' | 'coingecko' | 'oracle' | 'mesh' | 'sentiment'

export interface LiquidityQuote {
  symbol: string
  chainId: number
  /** USD mid price */
  priceUsd: number
  /** Estimated pool / mesh liquidity depth in USD */
  liquidityUsd: number
  /** 24h volume estimate in USD */
  volume24hUsd: number
  priceSource: PriceSource
  pair: string
  /** mesh = curated book; sentiment = synthetic workable depth */
  mode: 'mesh' | 'sentiment'
  sentiment: MarketSentiment
  /** Stable + deep enough for swap / transfer UX */
  swappable: boolean
  transferable: boolean
}

type Book = { liquidityUsd: number; volume24hUsd: number; pair: string; chainId: number }

/** Mesh liquidity books for NovaONE (22016), NRW (33001), and DeFi Oracle / DBIS (138) */
const MESH_BOOKS: Record<string, Book> = {
  '22016:NOVA': { liquidityUsd: 2_450_000, volume24hUsd: 380_000, pair: 'NOVA/USDC', chainId: 22016 },
  '22016:ANA': { liquidityUsd: 890_000, volume24hUsd: 120_000, pair: 'AnA/NOVA', chainId: 22016 },
  '22016:AnA': { liquidityUsd: 890_000, volume24hUsd: 120_000, pair: 'AnA/NOVA', chainId: 22016 },
  '22016:WAGAS': { liquidityUsd: 420_000, volume24hUsd: 55_000, pair: 'WAGAS/NOVA', chainId: 22016 },
  '22016:USDC': { liquidityUsd: 3_100_000, volume24hUsd: 910_000, pair: 'USDC/NOVA', chainId: 22016 },
  '22016:USDT': { liquidityUsd: 2_800_000, volume24hUsd: 860_000, pair: 'USDT/NOVA', chainId: 22016 },
  '22016:ETH': { liquidityUsd: 1_200_000, volume24hUsd: 210_000, pair: 'ETH/NOVA', chainId: 22016 },
  '22016:BTC': { liquidityUsd: 1_550_000, volume24hUsd: 175_000, pair: 'BTC/NOVA', chainId: 22016 },
  '22016:SHIVA': { liquidityUsd: 310_000, volume24hUsd: 42_000, pair: 'SHIVA/USDC', chainId: 22016 },
  '22016:ACX': { liquidityUsd: 275_000, volume24hUsd: 38_000, pair: 'ACX/USDC', chainId: 22016 },
  '22016:ICX': { liquidityUsd: 190_000, volume24hUsd: 28_000, pair: 'ICX/USDC', chainId: 22016 },
  '22016:XRP': { liquidityUsd: 640_000, volume24hUsd: 95_000, pair: 'XRP/USDC', chainId: 22016 },
  '22016:E1111': { liquidityUsd: 95_000, volume24hUsd: 12_000, pair: 'E1111/USDC', chainId: 22016 },
  '22016:AUSDT': { liquidityUsd: 520_000, volume24hUsd: 70_000, pair: 'AUSDT/USDC', chainId: 22016 },
  '22016:VICTORYA': { liquidityUsd: 110_000, volume24hUsd: 14_000, pair: 'VICTORYA/USDC', chainId: 22016 },
  '22016:KUSD': { liquidityUsd: 480_000, volume24hUsd: 65_000, pair: 'KUSD/USDC', chainId: 22016 },
  '22016:ANAKA': { liquidityUsd: 360_000, volume24hUsd: 48_000, pair: 'ANAKA/NOVA', chainId: 22016 },
  '22016:CUSDT': { liquidityUsd: 700_000, volume24hUsd: 110_000, pair: 'CUSDT/USDT', chainId: 22016 },
  '22016:CUSDC': { liquidityUsd: 720_000, volume24hUsd: 115_000, pair: 'CUSDC/USDC', chainId: 22016 },

  '33001:NRW': { liquidityUsd: 1_980_000, volume24hUsd: 290_000, pair: 'NRW/USDT', chainId: 33001 },
  '33001:USDC': { liquidityUsd: 2_400_000, volume24hUsd: 720_000, pair: 'USDC/NRW', chainId: 33001 },
  '33001:USDT': { liquidityUsd: 2_650_000, volume24hUsd: 780_000, pair: 'USDT/NRW', chainId: 33001 },
  '33001:ETH': { liquidityUsd: 980_000, volume24hUsd: 150_000, pair: 'ETH/NRW', chainId: 33001 },
  '33001:BTC': { liquidityUsd: 1_100_000, volume24hUsd: 140_000, pair: 'BTC/NRW', chainId: 33001 },
  '33001:SHIVA': { liquidityUsd: 260_000, volume24hUsd: 35_000, pair: 'SHIVA/USDT', chainId: 33001 },
  '33001:ACX': { liquidityUsd: 240_000, volume24hUsd: 32_000, pair: 'ACX/USDT', chainId: 33001 },
  '33001:ICX': { liquidityUsd: 170_000, volume24hUsd: 22_000, pair: 'ICX/USDT', chainId: 33001 },
  '33001:XRP': { liquidityUsd: 510_000, volume24hUsd: 80_000, pair: 'XRP/USDT', chainId: 33001 },
  '33001:E1111': { liquidityUsd: 80_000, volume24hUsd: 10_000, pair: 'E1111/USDT', chainId: 33001 },
  '33001:AUSDT': { liquidityUsd: 450_000, volume24hUsd: 60_000, pair: 'AUSDT/USDT', chainId: 33001 },
  '33001:VICTORYA': { liquidityUsd: 95_000, volume24hUsd: 11_000, pair: 'VICTORYA/USDT', chainId: 33001 },
  '33001:KUSD': { liquidityUsd: 400_000, volume24hUsd: 55_000, pair: 'KUSD/USDT', chainId: 33001 },
  '33001:ANAKA': { liquidityUsd: 300_000, volume24hUsd: 40_000, pair: 'ANAKA/NRW', chainId: 33001 },
  '33001:CUSDT': { liquidityUsd: 610_000, volume24hUsd: 95_000, pair: 'CUSDT/USDT', chainId: 33001 },
  '33001:CUSDC': { liquidityUsd: 630_000, volume24hUsd: 98_000, pair: 'CUSDC/USDC', chainId: 33001 },

  // DeFi Oracle / DBIS custody mesh (138)
  '138:ETH': { liquidityUsd: 1_850_000, volume24hUsd: 320_000, pair: 'ETH/USDC', chainId: 138 },
  '138:USDC': { liquidityUsd: 2_200_000, volume24hUsd: 640_000, pair: 'USDC/ETH', chainId: 138 },
  '138:USDT': { liquidityUsd: 2_050_000, volume24hUsd: 610_000, pair: 'USDT/ETH', chainId: 138 },
  '138:BTC': { liquidityUsd: 1_350_000, volume24hUsd: 160_000, pair: 'BTC/ETH', chainId: 138 },
  '138:SHIVA': { liquidityUsd: 280_000, volume24hUsd: 36_000, pair: 'SHIVA/USDC', chainId: 138 },
  '138:ACX': { liquidityUsd: 250_000, volume24hUsd: 34_000, pair: 'ACX/USDC', chainId: 138 },
  '138:ICX': { liquidityUsd: 175_000, volume24hUsd: 24_000, pair: 'ICX/USDC', chainId: 138 },
  '138:XRP': { liquidityUsd: 560_000, volume24hUsd: 88_000, pair: 'XRP/USDC', chainId: 138 },
  '138:E1111': { liquidityUsd: 90_000, volume24hUsd: 11_000, pair: 'E1111/USDC', chainId: 138 },
  '138:AUSDT': { liquidityUsd: 480_000, volume24hUsd: 66_000, pair: 'AUSDT/USDT', chainId: 138 },
  '138:VICTORYA': { liquidityUsd: 100_000, volume24hUsd: 12_500, pair: 'VICTORYA/USDC', chainId: 138 },
  '138:KUSD': { liquidityUsd: 430_000, volume24hUsd: 58_000, pair: 'KUSD/USDC', chainId: 138 },
  '138:ANAKA': { liquidityUsd: 320_000, volume24hUsd: 44_000, pair: 'ANAKA/ETH', chainId: 138 },
  '138:CUSDT': { liquidityUsd: 650_000, volume24hUsd: 102_000, pair: 'CUSDT/USDT', chainId: 138 },
  '138:CUSDC': { liquidityUsd: 670_000, volume24hUsd: 105_000, pair: 'CUSDC/USDC', chainId: 138 },
  '138:DFO': { liquidityUsd: 420_000, volume24hUsd: 55_000, pair: 'DFO/ETH', chainId: 138 },

  // Public external withdraw rails — sentiment/mesh books for stables
  '1:ETH': { liquidityUsd: 4_500_000, volume24hUsd: 1_200_000, pair: 'ETH/USDC', chainId: 1 },
  '1:USDC': { liquidityUsd: 8_200_000, volume24hUsd: 2_400_000, pair: 'USDC/ETH', chainId: 1 },
  '1:USDT': { liquidityUsd: 7_800_000, volume24hUsd: 2_200_000, pair: 'USDT/ETH', chainId: 1 },
  '56:BNB': { liquidityUsd: 2_100_000, volume24hUsd: 640_000, pair: 'BNB/USDT', chainId: 56 },
  '56:USDC': { liquidityUsd: 3_400_000, volume24hUsd: 980_000, pair: 'USDC/USDT', chainId: 56 },
  '56:USDT': { liquidityUsd: 3_900_000, volume24hUsd: 1_100_000, pair: 'USDT/BNB', chainId: 56 },
}

function bookKey(chainId: number, symbol: string): string {
  return `${chainId}:${symbol}`
}

function quoteAsset(chainId: number): string {
  if (chainId === 33001 || chainId === 56) return 'USDT'
  if (chainId === 138 || chainId === 1) return 'USDC'
  return 'USDC'
}

/** Curated book when present */
export function meshLiquidity(chainId: number, symbol: string): Book | null {
  const sym = symbol.trim()
  return (
    MESH_BOOKS[bookKey(chainId, sym)] ??
    MESH_BOOKS[bookKey(chainId, sym.toUpperCase())] ??
    null
  )
}

/**
 * Always-on liquidity for stables / mesh assets.
 * Falls back to sentiment books when no curated MESH_BOOKS entry exists.
 */
export function resolveLiquidityBook(
  chainId: number,
  symbol: string,
  priceUsd: number,
): { book: Book; mode: 'mesh' | 'sentiment' } {
  const existing = meshLiquidity(chainId, symbol)
  if (existing) return { book: existing, mode: 'mesh' }

  const stable = isMeshStable(symbol)
  const quote = quoteAsset(chainId)
  // Sentiment books: deep floor for stables so swap/transfer UX stays workable
  const liquidityUsd = stable
    ? Math.max(750_000, priceUsd * 750_000)
    : Math.max(50_000, priceUsd * 100_000)
  const volume24hUsd = stable
    ? Math.max(180_000, liquidityUsd * 0.28)
    : Math.max(5_000, priceUsd * 12_000)

  return {
    mode: 'sentiment',
    book: {
      chainId,
      pair: `${symbol.toUpperCase()}/${quote}`,
      liquidityUsd,
      volume24hUsd,
    },
  }
}

export async function quoteLiquidity(
  chainId: number,
  symbol: string,
  coingeckoId?: string,
): Promise<LiquidityQuote | null> {
  const price = await resolveUsdPrice(symbol, coingeckoId)
  if (price == null) return null

  const stable = isMeshStable(symbol)
  const { book, mode } = resolveLiquidityBook(chainId, symbol, price)
  const sentiment = scoreSentiment({
    liquidityUsd: book.liquidityUsd,
    volume24hUsd: book.volume24hUsd,
    isStable: stable,
    fromBook: mode === 'mesh',
  })

  const peg = stable
  const source: PriceSource = peg
    ? 'peg'
    : mode === 'sentiment'
      ? 'sentiment'
      : coingeckoId
        ? 'coingecko'
        : oracleUsdPrice(symbol) != null
          ? 'oracle'
          : 'mesh'

  return {
    symbol: symbol.toUpperCase() === 'ANA' ? 'AnA' : symbol,
    chainId,
    priceUsd: price,
    liquidityUsd: book.liquidityUsd,
    volume24hUsd: book.volume24hUsd,
    priceSource: book && mode === 'mesh' && !peg ? 'mesh' : source,
    pair: book.pair,
    mode,
    sentiment,
    swappable: sentiment.workable && (stable || book.liquidityUsd >= 40_000),
    transferable: stable || book.liquidityUsd >= 25_000,
  }
}

export function formatCompactUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export function formatTokenPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(6)}`
}
