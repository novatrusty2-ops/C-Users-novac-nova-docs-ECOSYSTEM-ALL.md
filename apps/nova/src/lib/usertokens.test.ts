import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearUserTokens,
  ensureNovaPlusTokensImported,
  importEcosystemTokensFromMesh,
  loadUserTokens,
  userTokensForChain,
} from './usertokens'

beforeEach(() => {
  clearUserTokens()
})

describe('usertokens import', () => {
  it('imports Nova Plus tokens across three chains', () => {
    const result = importEcosystemTokensFromMesh('ecosystem')
    expect(result.count).toBeGreaterThan(40)
    expect(result.added).toBe(result.count)
    expect(result.chains).toEqual([22016, 33001, 9001])
    expect(userTokensForChain(22016).some((t) => t.symbol === 'NOVA')).toBe(true)
    expect(userTokensForChain(33001).some((t) => t.symbol === 'NRW')).toBe(true)
    expect(userTokensForChain(9001).some((t) => t.symbol === 'NOVA')).toBe(true)
    expect(userTokensForChain(22016).some((t) => t.symbol === 'AnA' && t.address)).toBe(true)
  })

  it('auto-transfers all 7 bridge currencies onto Nova Plus + bridge', () => {
    importEcosystemTokensFromMesh('ecosystem')
    for (const sym of ['USD', 'EUR', 'GBP', 'AUD', 'CHF', 'JPY', 'SDG']) {
      expect(userTokensForChain(22016).some((t) => t.symbol === sym)).toBe(true)
      expect(userTokensForChain(33001).some((t) => t.symbol === sym)).toBe(true)
      expect(userTokensForChain(9001).some((t) => t.symbol === sym)).toBe(true)
      expect(userTokensForChain(11013).some((t) => t.symbol === sym)).toBe(true)
    }
  })

  it('is idempotent on second import', () => {
    importEcosystemTokensFromMesh()
    const second = importEcosystemTokensFromMesh()
    expect(second.added).toBe(0)
    expect(loadUserTokens().length).toBe(second.total)
  })

  it('auto-fills missing tokens via ensureNovaPlusTokensImported', () => {
    importEcosystemTokensFromMesh()
    const one = loadUserTokens()[0]!
    localStorage.setItem('nova.usertokens.v1', JSON.stringify([one]))
    localStorage.removeItem('nova.usertokens.catalog.v1')
    const r = ensureNovaPlusTokensImported()
    expect(r.added).toBeGreaterThan(10)
    expect(r.total).toBe(r.count)
    expect(userTokensForChain(9001).length).toBeGreaterThan(0)
  })

  it('normalizes legacy source tags to ecosystem', () => {
    localStorage.setItem(
      'nova.usertokens.v1',
      JSON.stringify([
        {
          chainId: 22016,
          token: {
            symbol: 'NOVA',
            name: 'Nova',
            decimals: 18,
            address: null,
            standard: 'native',
          },
          source: 'legacy',
          importedAt: Date.now(),
        },
      ]),
    )
    expect(loadUserTokens()[0]?.source).toBe('ecosystem')
  })
})
