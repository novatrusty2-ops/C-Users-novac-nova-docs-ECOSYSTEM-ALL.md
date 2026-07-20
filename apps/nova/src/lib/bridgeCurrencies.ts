/**
 * Nova Bank production mint.fiatCurrencies — the 7 bridge currencies.
 * Listed on Nova Plus chains + AnakaChain Bridge with full USD price & mesh liquidity.
 */
import type { ChainToken } from '@/types'
import { NOVA_PLUS_CHAIN_IDS } from './novaPlus'

export interface BridgeCurrencyTokenDef extends ChainToken {
  chainIds: number[]
  assetClass: 'fiat'
  importable: true
  tradable: true
  swappable: true
  transferable: true
  decentralized: false
}

export const BRIDGE_CURRENCY_SYMBOLS = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CHF',
  'JPY',
  'SDG',
] as const

export type BridgeCurrencySymbol = (typeof BRIDGE_CURRENCY_SYMBOLS)[number]

export interface BridgeCurrencyDef {
  symbol: BridgeCurrencySymbol
  name: string
  decimals: number
  /** USD mid (production oracle) */
  usd: number
  /** Display FX: units of currency per 1 USD */
  perUsd: number
  flag: string
  pair: string
  liquidityUsd: number
  volume24hUsd: number
}

/** Exact 7 bridge / mint fiat currencies from Nova Bank production */
export const BRIDGE_CURRENCIES: BridgeCurrencyDef[] = [
  {
    symbol: 'USD',
    name: 'US Dollar',
    decimals: 2,
    usd: 1,
    perUsd: 1,
    flag: 'US',
    pair: 'USD/USDC',
    liquidityUsd: 12_500_000,
    volume24hUsd: 3_200_000,
  },
  {
    symbol: 'EUR',
    name: 'Euro',
    decimals: 2,
    usd: 1.08,
    perUsd: 0.92,
    flag: 'EU',
    pair: 'EUR/USDC',
    liquidityUsd: 8_400_000,
    volume24hUsd: 1_900_000,
  },
  {
    symbol: 'GBP',
    name: 'British Pound',
    decimals: 2,
    usd: 1.27,
    perUsd: 0.79,
    flag: 'GB',
    pair: 'GBP/USDC',
    liquidityUsd: 6_100_000,
    volume24hUsd: 1_350_000,
  },
  {
    symbol: 'AUD',
    name: 'Australian Dollar',
    decimals: 2,
    usd: 0.66,
    perUsd: 1.52,
    flag: 'AU',
    pair: 'AUD/USDC',
    liquidityUsd: 3_800_000,
    volume24hUsd: 820_000,
  },
  {
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
    usd: 1.12,
    perUsd: 0.89,
    flag: 'CH',
    pair: 'CHF/USDC',
    liquidityUsd: 4_200_000,
    volume24hUsd: 910_000,
  },
  {
    symbol: 'JPY',
    name: 'Japanese Yen',
    decimals: 0,
    usd: 0.0067,
    perUsd: 149,
    flag: 'JP',
    pair: 'JPY/USDC',
    liquidityUsd: 5_500_000,
    volume24hUsd: 1_100_000,
  },
  {
    symbol: 'SDG',
    name: 'Sudanese Pound',
    decimals: 2,
    usd: 0.0017,
    perUsd: 600,
    flag: 'SD',
    pair: 'SDG/USDC',
    liquidityUsd: 1_250_000,
    volume24hUsd: 280_000,
  },
]

/** Nova Plus + AnakaChain Bridge */
export const BRIDGE_CURRENCY_CHAIN_IDS = [...NOVA_PLUS_CHAIN_IDS, 11013] as const

export function isBridgeCurrency(symbol: string): boolean {
  const upper = symbol.trim().toUpperCase()
  return (BRIDGE_CURRENCY_SYMBOLS as readonly string[]).includes(upper)
}

export function getBridgeCurrency(symbol: string): BridgeCurrencyDef | undefined {
  const upper = symbol.trim().toUpperCase()
  return BRIDGE_CURRENCIES.find((c) => c.symbol === upper)
}

/** Expand the 7 bridge currencies onto every Nova Plus + bridge chain */
export function bridgeCurrencyTokenDefs(): BridgeCurrencyTokenDef[] {
  const out: BridgeCurrencyTokenDef[] = []
  for (const c of BRIDGE_CURRENCIES) {
    for (const chainId of BRIDGE_CURRENCY_CHAIN_IDS) {
      out.push({
        symbol: c.symbol,
        name: c.name,
        decimals: c.decimals,
        address: null,
        standard: 'erc20',
        usd: c.usd,
        chainIds: [chainId],
        assetClass: 'fiat',
        importable: true,
        tradable: true,
        swappable: true,
        transferable: true,
        decentralized: false,
      })
    }
  }
  return out
}

export function bridgeLiquidityBook(
  chainId: number,
  symbol: string,
): { liquidityUsd: number; volume24hUsd: number; pair: string; chainId: number } | null {
  const c = getBridgeCurrency(symbol)
  if (!c) return null
  if (!(BRIDGE_CURRENCY_CHAIN_IDS as readonly number[]).includes(chainId)) return null
  const scale = chainId === 11013 ? 0.55 : chainId === 9001 ? 0.85 : 1
  return {
    liquidityUsd: Math.round(c.liquidityUsd * scale),
    volume24hUsd: Math.round(c.volume24hUsd * scale),
    pair: c.pair,
    chainId,
  }
}
