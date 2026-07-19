import { describe, expect, it } from 'vitest'
import { buildTokenSkills, enabledSkills } from './tokenSkills'

describe('tokenSkills', () => {
  it('enables trade/swap/chart on Nova Plus crypto', () => {
    const p = buildTokenSkills(
      {
        symbol: 'SHIVA',
        assetClass: 'crypto',
        tradable: true,
        swappable: true,
        transferable: true,
        decentralized: true,
      },
      22016,
    )
    const ids = enabledSkills(p).map((s) => s.id)
    expect(ids).toContain('trade')
    expect(ids).toContain('swap')
    expect(ids).toContain('chart')
    expect(ids).toContain('liquidity')
    expect(ids).toContain('mesh')
  })

  it('marks fiat custody skill', () => {
    const p = buildTokenSkills(
      {
        symbol: 'USD',
        assetClass: 'fiat',
        tradable: true,
        swappable: true,
        transferable: true,
        decentralized: false,
      },
      9001,
    )
    const ids = enabledSkills(p).map((s) => s.id)
    expect(ids).toContain('fiat')
    expect(ids).toContain('custody')
    expect(ids).not.toContain('trade')
  })
})
