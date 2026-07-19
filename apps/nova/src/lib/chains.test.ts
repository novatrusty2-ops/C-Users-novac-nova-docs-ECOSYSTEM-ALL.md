import { describe, expect, it } from 'vitest'
import { BRAND } from './brand.generated'
import { CHAINS, getChain, primaryChains, defaultChainIds } from './chains'
import { tokensForNovaOneAndNrw } from './ecosystemTokens'

/** Colors reserved for other products — Nova must not reuse them */
const FORBIDDEN_PURPLES = ['#8B5CF6', '#A855F7', '#8247E5']

describe('chains', () => {
  it('defaults include full Nova ecosystem EVMs', () => {
    const ids = defaultChainIds()
    expect(ids).toEqual(expect.arrayContaining([22016, 33001, 9001, 138, 11013, 651940]))
    expect(ids).not.toContain(1)
    expect(ids).not.toContain(56)
  })

  it('uses sky blue for NovaONE', () => {
    const novaone = getChain(22016)
    expect(novaone?.iconColor.toLowerCase()).toBe('#0ea5e9')
    expect(BRAND.chainColors.novaone.toLowerCase()).toBe('#0ea5e9')
  })

  it('uses teal for NRW World', () => {
    const nrw = getChain(33001)
    expect(nrw?.iconColor.toLowerCase()).toBe('#14b8a6')
  })

  it('includes Alltra for PouchPay partner', () => {
    const alltra = getChain(651940)
    expect(alltra?.partner).toBe('pouchpay')
    expect(alltra?.isDefault).toBe(true)
  })

  it('uses Nova brand chain colors only', () => {
    for (const chain of CHAINS) {
      expect(FORBIDDEN_PURPLES.map((c) => c.toLowerCase())).not.toContain(
        chain.iconColor.toLowerCase(),
      )
    }
  })

  it('marks ethereum and bsc as optional toggles', () => {
    expect(getChain(1)?.isOptional).toBe(true)
    expect(getChain(56)?.isOptional).toBe(true)
  })

  it('primary chains cover nova + partner mesh', () => {
    expect(primaryChains().length).toBeGreaterThanOrEqual(5)
  })

  it('ecosystem token catalog covers NovaONE and NRW', () => {
    const defs = tokensForNovaOneAndNrw()
    expect(defs.some((t) => t.symbol === 'NOVA' && t.chainIds.includes(22016))).toBe(true)
    expect(defs.some((t) => t.symbol === 'NRW' && t.chainIds.includes(33001))).toBe(true)
    expect(defs.some((t) => t.symbol === 'AnA')).toBe(true)
    expect(defs.some((t) => t.symbol === 'WAGAS')).toBe(true)
    expect(defs.length).toBeGreaterThan(10)
  })
})
