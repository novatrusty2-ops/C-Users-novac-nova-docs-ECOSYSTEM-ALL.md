import { describe, expect, it } from 'vitest'
import { trimHumanAmount } from './amounts'

describe('trimHumanAmount', () => {
  it('never chops integer trailing zeros', () => {
    expect(trimHumanAmount('110')).toBe('110')
    expect(trimHumanAmount('10')).toBe('10')
    expect(trimHumanAmount('1000')).toBe('1000')
  })

  it('strips fractional trailing zeros only', () => {
    expect(trimHumanAmount('1.1000')).toBe('1.1')
    expect(trimHumanAmount('1.0')).toBe('1')
    expect(trimHumanAmount('11.11')).toBe('11.11')
    expect(trimHumanAmount('0.0100')).toBe('0.01')
  })
})
