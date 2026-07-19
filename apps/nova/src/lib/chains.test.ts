import { describe, expect, it } from 'vitest'
import { BRAND } from './brand.generated'
import { CHAINS, getChain, primaryChains } from './chains'

const SIGNET_PURPLES = ['#8B5CF6', '#A855F7', '#8247E5']

describe('chains', () => {
  it('defaults to NovaONE and NRW only', () => {
    const defaults = CHAINS.filter((c) => c.isDefault)
    expect(defaults.map((c) => c.id)).toEqual([22016, 33001])
  })

  it('uses sky blue for NovaONE', () => {
    const novaone = getChain(22016)
    expect(novaone?.iconColor.toLowerCase()).toBe('#0ea5e9')
    expect(BRAND.chainColors.novaone.toLowerCase()).toBe('#0ea5e9')
  })

  it('uses teal for NRW World', () => {
    const nrw = getChain(33001)
    expect(nrw?.iconColor.toLowerCase()).toBe('#14b8a6')
    expect(BRAND.chainColors.nrw.toLowerCase()).toBe('#14b8a6')
  })

  it('does not use Signet purple chain colors', () => {
    for (const chain of CHAINS) {
      expect(SIGNET_PURPLES.map((c) => c.toLowerCase())).not.toContain(chain.iconColor.toLowerCase())
    }
  })

  it('marks ethereum and bsc as optional toggles', () => {
    const eth = getChain(1)
    const bsc = getChain(56)
    expect(eth?.isDefault).toBe(false)
    expect(eth?.isOptional).toBe(true)
    expect(bsc?.isDefault).toBe(false)
    expect(bsc?.isOptional).toBe(true)
  })

  it('primary chains are Nova mesh only', () => {
    expect(primaryChains().every((c) => c.category === 'nova')).toBe(true)
  })
})
