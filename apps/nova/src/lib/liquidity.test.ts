import { describe, expect, it } from 'vitest'
import { formatCompactUsd, formatTokenPrice, meshLiquidity, quoteLiquidity } from './liquidity'

describe('liquidity', () => {
  it('has NovaONE and NRW mesh books', () => {
    expect(meshLiquidity(22016, 'NOVA')?.liquidityUsd).toBeGreaterThan(1_000_000)
    expect(meshLiquidity(33001, 'NRW')?.liquidityUsd).toBeGreaterThan(1_000_000)
    expect(meshLiquidity(22016, 'USDC')?.pair).toContain('USDC')
  })

  it('quotes price + liquidity for importable tokens', async () => {
    const q = await quoteLiquidity(22016, 'NOVA')
    expect(q).not.toBeNull()
    expect(q!.priceUsd).toBeGreaterThan(0)
    expect(q!.liquidityUsd).toBeGreaterThan(0)
    expect(q!.volume24hUsd).toBeGreaterThan(0)
  })

  it('pegs stables to $1 with deep liquidity', async () => {
    const q = await quoteLiquidity(33001, 'USDT')
    expect(q!.priceUsd).toBe(1)
    expect(q!.liquidityUsd).toBeGreaterThan(100_000)
  })

  it('formats compact usd and prices', () => {
    expect(formatCompactUsd(2_450_000)).toBe('$2.45M')
    expect(formatCompactUsd(12_500)).toBe('$12.5K')
    expect(formatTokenPrice(1)).toBe('$1.00')
    expect(formatTokenPrice(0.045)).toMatch(/\$0\.04/)
  })
})
