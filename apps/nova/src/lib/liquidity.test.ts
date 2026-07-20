import { describe, expect, it } from 'vitest'
import {
  formatCompactUsd,
  formatTokenPrice,
  meshLiquidity,
  quoteLiquidity,
  resolveLiquidityBook,
} from './liquidity'

describe('liquidity', () => {
  it('has NovaONE, NRW, and DBIS 138 mesh books', () => {
    expect(meshLiquidity(22016, 'NOVA')?.liquidityUsd).toBeGreaterThan(1_000_000)
    expect(meshLiquidity(33001, 'NRW')?.liquidityUsd).toBeGreaterThan(1_000_000)
    expect(meshLiquidity(22016, 'USDC')?.pair).toContain('USDC')
    expect(meshLiquidity(138, 'ETH')?.liquidityUsd).toBeGreaterThan(1_000_000)
    expect(meshLiquidity(138, 'USDT')?.pair).toContain('USDT')
  })

  it('quotes price + liquidity for importable tokens', async () => {
    const q = await quoteLiquidity(22016, 'NOVA')
    expect(q).not.toBeNull()
    expect(q!.priceUsd).toBeGreaterThan(0)
    expect(q!.liquidityUsd).toBeGreaterThan(0)
    expect(q!.volume24hUsd).toBeGreaterThan(0)
    expect(q!.sentiment.workable).toBe(true)
  })

  it('quotes every DBIS custody symbol with value + liquidity', async () => {
    const symbols = [
      'ETH',
      'USDC',
      'USDT',
      'BTC',
      'SHIVA',
      'ACX',
      'ICX',
      'XRP',
      'E1111',
      'AUSDT',
      'VICTORYA',
      'KUSD',
      'ANAKA',
      'CUSDT',
      'CUSDC',
    ]
    for (const symbol of symbols) {
      const q = await quoteLiquidity(138, symbol)
      expect(q, symbol).not.toBeNull()
      expect(q!.priceUsd, symbol).toBeGreaterThan(0)
      expect(q!.liquidityUsd, symbol).toBeGreaterThan(0)
      expect(q!.swappable, symbol).toBe(true)
    }
  })

  it('pegs stables to $1 with deep workable liquidity', async () => {
    const q = await quoteLiquidity(33001, 'USDT')
    expect(q!.priceUsd).toBe(1)
    expect(q!.liquidityUsd).toBeGreaterThan(100_000)
    expect(q!.swappable).toBe(true)
    expect(q!.transferable).toBe(true)
    expect(q!.sentiment.workable).toBe(true)
  })

  it('falls back to sentiment books for unknown stable chains', () => {
    const { book, mode } = resolveLiquidityBook(99999, 'USDC', 1)
    expect(mode).toBe('sentiment')
    expect(book.liquidityUsd).toBeGreaterThanOrEqual(750_000)
  })

  it('has ethereum and bsc stable books for external withdraw rails', async () => {
    const eth = await quoteLiquidity(1, 'USDT')
    const bsc = await quoteLiquidity(56, 'USDC')
    expect(eth!.swappable).toBe(true)
    expect(bsc!.swappable).toBe(true)
    expect(eth!.liquidityUsd).toBeGreaterThan(1_000_000)
  })

  it('formats compact usd and prices', () => {
    expect(formatCompactUsd(2_450_000)).toBe('$2.45M')
    expect(formatCompactUsd(12_500)).toBe('$12.5K')
    expect(formatTokenPrice(1)).toBe('$1.00')
    expect(formatTokenPrice(0.045)).toMatch(/\$0\.04/)
  })
})
