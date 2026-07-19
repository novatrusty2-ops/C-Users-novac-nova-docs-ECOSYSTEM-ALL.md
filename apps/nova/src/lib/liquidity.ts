import { oracleUsdPrice } from './oracle'
import { resolveUsdPrice } from './prices'

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

/** Mesh liquidity books for NovaONE (22016) and NRW (33001) */
const MESH_BOOKS: Record<
  string,
  { liquidityUsd: number; volume24hUsd: number; pair: string; chainId: number }
> = {
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
}

function bookKey(chainId: number, symbol: string): string {
  return `${chainId}:${symbol}`
}

export function meshLiquidity(chainId: number, symbol: string) {
  const sym = symbol.trim()
  return (
    MESH_BOOKS[bookKey(chainId, sym)] ??
    MESH_BOOKS[bookKey(chainId, sym.toUpperCase())] ??
    null
  )
}

export async function quoteLiquidity(
  chainId: number,
  symbol: string,
  coingeckoId?: string,
): Promise<LiquidityQuote | null> {
  const price = await resolveUsdPrice(symbol, coingeckoId)
  if (price == null) return null

  const book = meshLiquidity(chainId, symbol)
  const peg = ['USDC', 'USDT', 'USD', 'DAI', 'AUSDT', 'CUSDT', 'CUSDC', 'KUSD'].includes(
    symbol.toUpperCase(),
  )
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
