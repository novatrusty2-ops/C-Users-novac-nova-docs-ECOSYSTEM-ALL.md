import { describe, expect, it } from 'vitest'
import { buildPortfolioChart, buildTokenChart, chartPolyline } from './charts'

describe('charts', () => {
  it('builds a stable series for NovaONE NOVA', () => {
    const a = buildTokenChart(22016, 'NOVA', '1D', 1)
    const b = buildTokenChart(22016, 'NOVA', '1D', 1)
    expect(a.points.length).toBeGreaterThan(10)
    expect(a.last).toBe(1)
    expect(a.points.map((p) => p.price)).toEqual(b.points.map((p) => p.price))
    expect(a.pair).toContain('NOVA')
  })

  it('covers mesh + DBIS 138 stables with tight peg charts', () => {
    for (const chainId of [22016, 33001, 138, 9001]) {
      const s = buildTokenChart(chainId, 'USDC', '1W', 1)
      expect(s.changePct).toBeTypeOf('number')
      expect(s.high).toBeGreaterThanOrEqual(s.low)
      expect(Math.abs(s.last - 1)).toBeLessThan(0.01)
    }
  })

  it('builds portfolio sparkline', () => {
    const s = buildPortfolioChart(12_500)
    expect(s.points.length).toBeGreaterThan(10)
    expect(s.last).toBeGreaterThan(0)
  })

  it('builds svg paths', () => {
    const s = buildTokenChart(138, 'ETH', '1H', 3500)
    const p = chartPolyline(s.points, 100, 40)
    expect(p.line.startsWith('M')).toBe(true)
    expect(p.area.includes('Z')).toBe(true)
  })
})
