import { oracleUsdPrice } from './oracle'
import { resolveUsdPrice } from './prices'
import { NOVA_PLUS_CHAIN_IDS, quoteAssetForChain } from './novaPlus'
import { NOVA_PLUS_SNAPSHOT } from './novaPlusSnapshot'
import { bridgeLiquidityBook, isBridgeCurrency } from './bridgeCurrencies'

export type PriceSource = 'peg' | 'coingecko' | 'oracle' | 'mesh'

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
}

type Book = { liquidityUsd: number; volume24hUsd: number; pair: string; chainId: number }

/** Hand-tuned deep books for core mesh pairs */
const CORE_BOOKS: Record<string, Book> = {
  '22016:NOVA': { liquidityUsd: 2_450_000, volume24hUsd: 380_000, pair: 'NOVA/USDC', chainId: 22016 },
  '22016:ANA': { liquidityUsd: 890_000, volume24hUsd: 120_000, pair: 'AnA/NOVA', chainId: 22016 },
  '22016:AnA': { liquidityUsd: 890_000, volume24hUsd: 120_000, pair: 'AnA/NOVA', chainId: 22016 },
  '22016:WAGAS': { liquidityUsd: 420_000, volume24hUsd: 55_000, pair: 'WAGAS/NOVA', chainId: 22016 },
  '22016:USDC': { liquidityUsd: 3_100_000, volume24hUsd: 910_000, pair: 'USDC/NOVA', chainId: 22016 },
  '22016:USDT': { liquidityUsd: 2_800_000, volume24hUsd: 860_000, pair: 'USDT/NOVA', chainId: 22016 },
  '22016:ETH': { liquidityUsd: 1_200_000, volume24hUsd: 210_000, pair: 'ETH/NOVA', chainId: 22016 },
  '22016:BTC': { liquidityUsd: 1_550_000, volume24hUsd: 175_000, pair: 'BTC/NOVA', chainId: 22016 },

  '33001:NRW': { liquidityUsd: 1_980_000, volume24hUsd: 290_000, pair: 'NRW/USDT', chainId: 33001 },
  '33001:USDC': { liquidityUsd: 2_400_000, volume24hUsd: 720_000, pair: 'USDC/NRW', chainId: 33001 },
  '33001:USDT': { liquidityUsd: 2_650_000, volume24hUsd: 780_000, pair: 'USDT/NRW', chainId: 33001 },
  '33001:ETH': { liquidityUsd: 980_000, volume24hUsd: 150_000, pair: 'ETH/NRW', chainId: 33001 },
  '33001:BTC': { liquidityUsd: 1_100_000, volume24hUsd: 140_000, pair: 'BTC/NRW', chainId: 33001 },

  '9001:NOVA': { liquidityUsd: 1_750_000, volume24hUsd: 210_000, pair: 'NOVA/USDC', chainId: 9001 },
  '9001:USDC': { liquidityUsd: 1_900_000, volume24hUsd: 420_000, pair: 'USDC/NOVA', chainId: 9001 },
  '9001:USDT': { liquidityUsd: 1_850_000, volume24hUsd: 400_000, pair: 'USDT/NOVA', chainId: 9001 },
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function syntheticBook(chainId: number, symbol: string): Book {
  const price = oracleUsdPrice(symbol) ?? 0.05
  const h = hash(`${chainId}:${symbol}`)
  const depthMul = 0.55 + (h % 100) / 100
  const base =
    price >= 1000 ? 1_200_000 : price >= 1 ? 450_000 : price >= 0.1 ? 220_000 : 95_000
  const liquidityUsd = Math.round(base * depthMul)
  const volume24hUsd = Math.round(liquidityUsd * (0.08 + (h % 40) / 200))
  const quote = quoteAssetForChain(chainId)
  return {
    liquidityUsd,
    volume24hUsd,
    pair: `${symbol}/${quote}`,
    chainId,
  }
}

/** Full Nova Plus liquidity books — core + snapshot symbols on all 3 chains */
function buildMeshBooks(): Record<string, Book> {
  const books: Record<string, Book> = { ...CORE_BOOKS }
  for (const snap of NOVA_PLUS_SNAPSHOT) {
    for (const chainId of snap.chainIds) {
      if (!(NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(chainId)) continue
      const key = `${chainId}:${snap.symbol}`
      if (!books[key]) books[key] = syntheticBook(chainId, snap.symbol)
      const upper = `${chainId}:${snap.symbol.toUpperCase()}`
      if (!books[upper]) books[upper] = books[key]!
    }
  }
  // AnA / WAGAS extras
  for (const sym of ['AnA', 'WAGAS', 'ANA']) {
    const key = `22016:${sym}`
    if (!books[key]) books[key] = syntheticBook(22016, sym)
  }
  return books
}

const MESH_BOOKS = buildMeshBooks()

function bookKey(chainId: number, symbol: string): string {
  return `${chainId}:${symbol}`
}

export function meshLiquidity(chainId: number, symbol: string) {
  const sym = symbol.trim()
  if (isBridgeCurrency(sym)) {
    const bridge = bridgeLiquidityBook(chainId, sym)
    if (bridge) return bridge
  }
  return (
    MESH_BOOKS[bookKey(chainId, sym)] ??
    MESH_BOOKS[bookKey(chainId, sym.toUpperCase())] ??
    ((NOVA_PLUS_CHAIN_IDS as readonly number[]).includes(chainId)
      ? syntheticBook(chainId, sym)
      : null)
  )
}

const PEGS = new Set([
  'USDC',
  'USDT',
  'USD',
  'DAI',
  'AUSDT',
  'AUSDC',
  'CUSDT',
  'CUSDC',
  'KUSD',
  'USDT-LEGACY',
  'USDT-TRC20',
  'USDT-BNB',
  'NSB-AUSDT',
])

export async function quoteLiquidity(
  chainId: number,
  symbol: string,
  coingeckoId?: string,
): Promise<LiquidityQuote | null> {
  const price = await resolveUsdPrice(symbol, coingeckoId)
  if (price == null) return null

  const book = meshLiquidity(chainId, symbol)
  const peg = PEGS.has(symbol.toUpperCase())
  const source: PriceSource = peg
    ? 'peg'
    : coingeckoId
      ? 'coingecko'
      : oracleUsdPrice(symbol) != null
        ? 'oracle'
        : 'mesh'

  return {
    symbol: symbol.toUpperCase() === 'ANA' ? 'AnA' : symbol,
    chainId,
    priceUsd: price,
    liquidityUsd: book?.liquidityUsd ?? Math.max(50_000, price * 100_000),
    volume24hUsd: book?.volume24hUsd ?? Math.max(5_000, price * 12_000),
    priceSource: book ? 'mesh' : source,
    pair: book?.pair ?? `${symbol}/USD`,
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
