/** Static fallback USD prices for Nova mesh + ecosystem tokens */
export const ORACLE_USD: Record<string, number> = {
  USD: 1,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  BUSD: 1,
  AUSDT: 1,
  CUSDT: 1,
  CUSDC: 1,
  KUSD: 1,
  ETH: 3500,
  WETH: 3500,
  BTC: 95_000,
  WBTC: 95_000,
  BNB: 600,
  XRP: 0.62,
  SOL: 145,
  TRX: 0.12,
  MATIC: 0.55,
  POL: 0.55,
  NOVA: 1.0,
  NRW: 1.0,
  ANA: 1.0,
  AnA: 1.0,
  WAGAS: 0.01,
  AGAS: 0.01,
  ANKA: 0.25,
  ALL: 0.08,
  SHIVA: 0.12,
  ACX: 0.18,
  ICX: 0.09,
  E1111: 0.045,
  VICTORYA: 0.06,
  ANAKA: 0.15,
  DFO: 1.2,
}

export function oracleUsdPrice(symbol: string): number | null {
  const raw = symbol.trim()
  const upper = raw.toUpperCase()
  if (upper in ORACLE_USD) return ORACLE_USD[upper]!
  if (raw in ORACLE_USD) return ORACLE_USD[raw]!
  // case-insensitive fallback
  for (const [k, v] of Object.entries(ORACLE_USD)) {
    if (k.toUpperCase() === upper) return v
  }
  return null
}
