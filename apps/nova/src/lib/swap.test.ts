import { describe, expect, it } from 'vitest'
import { quoteSwap, SWAP_FEE_BPS } from './swap'

describe('swap', () => {
  it('uses 0.3% fee (30 bps)', () => {
    expect(SWAP_FEE_BPS).toBe(30)
  })

  it('quotes 1:1 stable swap minus fee', async () => {
    const q = await quoteSwap('USDC', 'USDT', '1000')
    expect(q.rate).toBe(1)
    expect(q.feeBps).toBe(30)
    expect(Number(q.feeAmount)).toBeCloseTo(3, 5)
    expect(Number(q.amountOut)).toBeCloseTo(997, 5)
    expect(q.provider).toBe('internal')
  })

  it('rejects same token', async () => {
    await expect(quoteSwap('USDC', 'USDC', '100')).rejects.toThrow(/same token/i)
  })

  it('rejects invalid amount', async () => {
    await expect(quoteSwap('USDC', 'USDT', '0')).rejects.toThrow(/invalid amount/i)
    await expect(quoteSwap('USDC', 'USDT', '-5')).rejects.toThrow(/invalid amount/i)
  })

  it('quotes cross-asset swap using oracle prices', async () => {
    const q = await quoteSwap('NOVA', 'NRW', '100')
    expect(Number(q.amountOut)).toBeGreaterThan(0)
    expect(Number(q.feeAmount)).toBeCloseTo(0.3, 5)
  })

  it('quotes AUSDT to ETH via oracle (wallet Trade path)', async () => {
    const q = await quoteSwap('AUSDT', 'ETH', '100')
    expect(q.fromSymbol).toBe('AUSDT')
    expect(q.toSymbol).toBe('ETH')
    expect(Number(q.amountOut)).toBeGreaterThan(0)
    expect(q.feeBps).toBe(30)
    // AUSDT ~$1, ETH ≫ $1 → out should be well under 1 ETH for 100 AUSDT
    expect(Number(q.amountOut)).toBeLessThan(1)
  })

  it('throws when price unavailable', async () => {
    await expect(quoteSwap('UNKNOWN', 'USDC', '10')).rejects.toThrow(/price unavailable/i)
  })
})
