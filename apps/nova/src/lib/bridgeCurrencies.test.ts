import { describe, expect, it } from 'vitest'
import {
  BRIDGE_CURRENCIES,
  BRIDGE_CURRENCY_SYMBOLS,
  bridgeCurrencyTokenDefs,
  bridgeLiquidityBook,
  isBridgeCurrency,
} from './bridgeCurrencies'

describe('bridgeCurrencies', () => {
  it('has exactly 7 production bridge currencies', () => {
    expect(BRIDGE_CURRENCY_SYMBOLS).toHaveLength(7)
    expect(BRIDGE_CURRENCIES).toHaveLength(7)
    expect([...BRIDGE_CURRENCY_SYMBOLS]).toEqual([
      'USD',
      'EUR',
      'GBP',
      'AUD',
      'CHF',
      'JPY',
      'SDG',
    ])
  })

  it('lists each currency on Nova Plus + Anaka Bridge', () => {
    const defs = bridgeCurrencyTokenDefs()
    expect(defs.length).toBe(7 * 4) // 3 Nova Plus + bridge
    for (const sym of BRIDGE_CURRENCY_SYMBOLS) {
      expect(defs.filter((d) => d.symbol === sym).map((d) => d.chainIds[0]).sort()).toEqual([
        11013, 22016, 33001, 9001,
      ])
      expect(isBridgeCurrency(sym)).toBe(true)
      expect(bridgeLiquidityBook(22016, sym)?.liquidityUsd).toBeGreaterThan(1_000_000)
    }
  })
})
