import { describe, expect, it } from 'vitest'
import {
  canWithdrawToken,
  isExternalWithdrawAddress,
  validateWithdrawAddress,
  withdrawDestinationsForToken,
  withdrawableTokens,
  withdrawWarning,
} from './withdraw'

describe('external withdraw', () => {
  it('offers public destinations for stables and ETH', () => {
    const usdt = withdrawDestinationsForToken('USDT')
    expect(usdt.some((d) => d.chainId === 1)).toBe(true)
    expect(usdt.some((d) => d.chainId === 138)).toBe(true)
    const meshOnly = withdrawDestinationsForToken('SHIVA')
    expect(meshOnly.every((d) => d.kind !== 'public')).toBe(true)
  })

  it('validates external EVM addresses', () => {
    expect(isExternalWithdrawAddress('0x0000000000000000000000000000000000000001')).toBe(true)
    expect(() => validateWithdrawAddress('not-an-address')).toThrow(/invalid/i)
  })

  it('warns on public and custody withdraws', () => {
    const eth = withdrawDestinationsForToken('USDC').find((d) => d.id === 'ethereum')!
    expect(withdrawWarning(eth, 'USDC')).toMatch(/external/i)
    const dbis = withdrawDestinationsForToken('USDT').find((d) => d.id === 'dbis-138')!
    expect(withdrawWarning(dbis, 'USDT')).toMatch(/138/)
  })

  it('lists withdrawable stables and natives', () => {
    const tokens = withdrawableTokens(138, [
      { symbol: 'ETH', name: 'Ether', decimals: 18, address: null, standard: 'native' },
      { symbol: 'USDT', name: 'Tether', decimals: 6, address: null, standard: 'erc20' },
      { symbol: 'SHIVA', name: 'Shiva', decimals: 6, address: null, standard: 'erc20' },
    ])
    expect(tokens.some((t) => t.symbol === 'ETH')).toBe(true)
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true)
  })

  it('blocks ERC-20 withdraw without contract', () => {
    const gate = canWithdrawToken(138, {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: null,
      standard: 'erc20',
      tradable: true,
      transferable: true,
    })
    expect(gate.ok).toBe(false)
  })

  it('allows native ETH withdraw on 138', () => {
    const gate = canWithdrawToken(138, {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: null,
      standard: 'native',
    })
    expect(gate.ok).toBe(true)
  })
})
