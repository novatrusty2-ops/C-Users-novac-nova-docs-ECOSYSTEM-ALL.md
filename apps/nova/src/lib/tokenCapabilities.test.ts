import { describe, expect, it } from 'vitest'
import {
  canTransferToken,
  canTradeToken,
  defaultTokenFlags,
  isMeshStable,
} from './tokenCapabilities'

describe('tokenCapabilities', () => {
  it('treats USDC/USDT/CUSDC as mesh stables', () => {
    expect(isMeshStable('USDC')).toBe(true)
    expect(isMeshStable('usdt')).toBe(true)
    expect(isMeshStable('CUSDC')).toBe(true)
    expect(isMeshStable('ETH')).toBe(false)
  })

  it('marks DBIS 138 catalog as tradable + transferable', () => {
    const flags = defaultTokenFlags(138, {
      symbol: 'USDT',
      standard: 'erc20',
      address: null,
    })
    expect(flags.tradable).toBe(true)
    expect(flags.transferable).toBe(true)
    expect(flags.swappable).toBe(true)
  })

  it('blocks ERC-20 transfer without contract address', () => {
    const gate = canTransferToken(138, {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: null,
      standard: 'erc20',
      transferable: true,
    })
    expect(gate.ok).toBe(false)
  })

  it('allows native ETH transfer on 138', () => {
    const gate = canTransferToken(138, {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: null,
      standard: 'native',
    })
    expect(gate.ok).toBe(true)
    expect(canTradeToken(138, {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: null,
      standard: 'native',
    })).toBe(true)
  })

  it('allows ERC-20 transfer when contract is known', () => {
    const gate = canTransferToken(1, {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      standard: 'erc20',
      transferable: true,
      tradable: true,
      swappable: true,
    })
    expect(gate.ok).toBe(true)
  })

  it('keeps ethereum/bsc stables swappable and transferable', () => {
    const eth = defaultTokenFlags(1, {
      symbol: 'USDT',
      standard: 'erc20',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    })
    expect(eth.tradable).toBe(true)
    expect(eth.swappable).toBe(true)
    expect(eth.transferable).toBe(true)
  })
})
