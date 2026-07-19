/** Static fallback USD prices for Nova mesh tokens */
export const ORACLE_USD: Record<string, number> = {
  USD: 1,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  ETH: 3500,
  BNB: 600,
  NOVA: 1,
  NRW: 1,
  AnA: 1,
}

export function oracleUsdPrice(symbol: string): number | null {
  const key = symbol.trim().toUpperCase()
  if (key in ORACLE_USD) return ORACLE_USD[key]!
  return null
}
