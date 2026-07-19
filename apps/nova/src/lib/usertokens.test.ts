import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearUserTokens,
  importEcosystemTokensFromMesh,
  loadUserTokens,
  userTokensForChain,
} from './usertokens'

beforeEach(() => {
  clearUserTokens()
})

describe('usertokens import', () => {
  it('imports NovaONE and NRW ecosystem tokens', () => {
    const result = importEcosystemTokensFromMesh('ecosystem')
    expect(result.count).toBeGreaterThan(10)
    expect(result.added).toBe(result.count)
    expect(userTokensForChain(22016).some((t) => t.symbol === 'NOVA')).toBe(true)
    expect(userTokensForChain(33001).some((t) => t.symbol === 'NRW')).toBe(true)
    expect(userTokensForChain(22016).some((t) => t.symbol === 'AnA' && t.address)).toBe(true)
  })

  it('is idempotent on second import', () => {
    importEcosystemTokensFromMesh()
    const second = importEcosystemTokensFromMesh()
    expect(second.added).toBe(0)
    expect(loadUserTokens().length).toBe(second.total)
  })

  it('supports signet source tag', () => {
    const r = importEcosystemTokensFromMesh('signet')
    expect(r.added).toBeGreaterThan(0)
    expect(loadUserTokens().every((t) => t.source === 'signet')).toBe(true)
  })
})
