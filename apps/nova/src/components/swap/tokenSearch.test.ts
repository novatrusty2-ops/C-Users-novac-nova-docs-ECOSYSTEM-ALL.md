import { describe, expect, it } from 'vitest'
import { tokenMatchesSearch } from './tokenSearch'

describe('tokenMatchesSearch', () => {
  it('matches 11::11 via common aliases', () => {
    expect(tokenMatchesSearch('11::11', '11:11')).toBe(true)
    expect(tokenMatchesSearch('11::11', '11;11')).toBe(true)
    expect(tokenMatchesSearch('11::11', '11::11')).toBe(true)
    expect(tokenMatchesSearch('11::11', '11')).toBe(true)
    expect(tokenMatchesSearch('11::11', '1111')).toBe(true)
  })

  it('still filters unrelated symbols', () => {
    expect(tokenMatchesSearch('AUSDT', '11:11')).toBe(false)
    expect(tokenMatchesSearch('ALL', 'btc')).toBe(false)
  })
})
