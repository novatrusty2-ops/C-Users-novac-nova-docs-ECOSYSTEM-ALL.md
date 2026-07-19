/** Static fallback USD prices — aligned with ECOSYSTEM refPriceUsd where applicable */
export const ORACLE_USD: Record<string, number> = {
  USD: 1,
  USDC: 1,
  USDT: 0.9998,
  DAI: 1,
  xDAI: 1,
  ETH: 3500,
  BTC: 97000,
  BNB: 600,
  SOL: 145,
  AVAX: 35,
  POL: 0.72,
  MATIC: 0.72,
  MNT: 0.85,
  CELO: 0.55,
  CRO: 0.12,
  NOVA: 1,
  NRW: 1,
  AGAS: 0.01,
  WAGAS: 0.01,
  AnA: 1,
  DFO: 0.5,
  ALL: 0.08,
  TRX: 0.24,
  SHIVA: 1,
  ACX: 1,
  ICX: 1,
  XRP: 1,
  E1111: 1,
  AUSDT: 1,
  VICTORYA: 1,
  KUSD: 1,
  ANAKA: 1,
  CUSDT: 1,
  CUSDC: 1,
}

export function oracleUsdPrice(symbol: string): number | null {
  const key = symbol.trim().toUpperCase()
  if (key in ORACLE_USD) return ORACLE_USD[key]!
  return null
}
