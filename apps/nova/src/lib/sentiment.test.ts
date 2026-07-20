import { describe, expect, it } from 'vitest'
import { pairSentiment, scoreSentiment } from './sentiment'

describe('sentiment', () => {
  it('floors stables to workable steady/strong', () => {
    const s = scoreSentiment({
      liquidityUsd: 100_000,
      volume24hUsd: 20_000,
      isStable: true,
      fromBook: false,
    })
    expect(s.score).toBeGreaterThanOrEqual(62)
    expect(s.workable).toBe(true)
    expect(s.mode).toBe('sentiment')
  })

  it('marks deep mesh books as strong', () => {
    const s = scoreSentiment({
      liquidityUsd: 3_000_000,
      volume24hUsd: 900_000,
      isStable: true,
      fromBook: true,
    })
    expect(s.label).toBe('strong')
    expect(s.mode).toBe('mesh')
    expect(s.workable).toBe(true)
  })

  it('pair sentiment uses the thinner side', () => {
    const s = pairSentiment(2_000_000, 100_000, 500_000, 10_000, true, false)
    expect(s.workable).toBe(true)
    expect(s.score).toBeGreaterThan(0)
  })
})
