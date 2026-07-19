import { NOVA_PLUS_SNAPSHOT } from './novaPlusSnapshot'

/** Static fallback USD prices for Nova Plus + ecosystem tokens */
export const ORACLE_USD: Record<string, number> = {
  USD: 1,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  BUSD: 1,
  AUSDT: 1,
  AUSDC: 1,
  CUSDT: 1,
  CUSDC: 1,
  KUSD: 1,
  'USDT-LEGACY': 1,
  'USDT-TRC20': 1,
  'USDT-BNB': 1,
  'NSB-AUSDT': 1,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  CHF: 1.12,
  JPY: 0.0067,
  SDG: 0.0017,
  CNY: 0.14,
  ETH: 3500,
  WETH: 3500,
  BTC: 95_000,
  WBTC: 95_000,
  BNB: 600,
  WBNB: 600,
  XRP: 0.62,
  SOL: 145,
  TRX: 0.12,
  WTRX: 0.12,
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
  '11::11': 0.045,
  VICTORYA: 0.06,
  ANAKA: 0.15,
  DFO: 1.2,
  '$BUCKS': 0.01,
  AUDA: 0.66,
  BRK: 0.02,
  CHT: 0.03,
  FIRE: 0.04,
  FLKR: 0.02,
  FSH: 0.015,
  GLD1111: 2.4,
  HYBX: 0.08,
  HYDX: 0.07,
  MONEEZ: 0.01,
  PAYINQ: 0.05,
  PSS: 0.03,
  SFY: 0.04,
  SKSH: 0.02,
  SON: 0.03,
  TN8: 0.02,
  VCE: 0.05,
  WALL: 0.02,
  ZRG: 0.03,
  ZARA: 0.04,
}

// Merge production snapshot prices
for (const t of NOVA_PLUS_SNAPSHOT) {
  if (ORACLE_USD[t.symbol] == null) ORACLE_USD[t.symbol] = t.usd
  const upper = t.symbol.toUpperCase()
  if (ORACLE_USD[upper] == null) ORACLE_USD[upper] = t.usd
}

export function oracleUsdPrice(symbol: string): number | null {
  const raw = symbol.trim()
  const upper = raw.toUpperCase()
  if (upper in ORACLE_USD) return ORACLE_USD[upper]!
  if (raw in ORACLE_USD) return ORACLE_USD[raw]!
  for (const [k, v] of Object.entries(ORACLE_USD)) {
    if (k.toUpperCase() === upper) return v
  }
  return null
}
