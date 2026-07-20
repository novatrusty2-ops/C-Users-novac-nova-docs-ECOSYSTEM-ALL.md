import { describe, expect, it } from 'vitest'
import { buildTokenChart, chartPolyline } from './charts'

describe('charts', () => {
  it('builds a stable series for NovaONE NOVA', () => {
    const a = buildTokenChart(22016, 'NOVA', '1D', 1)
    const b = buildTokenChart(22016, 'NOVA', '1D', 1)
    expect(a.points.length).toBeGreaterThan(10)
    expect(a.last).toBe(1)
    expect(a.points.map((p) => p.price)).toEqual(b.points.map((p) => p.price))
    expect(a.pair).toContain('NOVA')
  })

  it('covers all three Nova Plus chains', () => {
    for (const chainId of [22016, 33001, 9001]) {
      const s = buildTokenChart(chainId, 'USDC', '1W', 1)
      expect(s.changePct).toBeTypeOf('number')
      expect(s.high).toBeGreaterThanOrEqual(s.low)
    }
  })

  it('builds svg paths', () => {
    const s = buildTokenChart(33001, 'NRW', '1H', 1)
    const p = chartPolyline(s.points, 100, 40)
    expect(p.line.startsWith('M')).toBe(true)
    expect(p.area.includes('Z')).toBe(true)
  })
})
