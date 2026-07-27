import { describe, expect, it } from 'vitest'
import { alltraRpcEndpoints, isAlltraRpcTransportError } from './rpc'

describe('alltraRpcEndpoints', () => {
  it('dedupes and puts preferred first', () => {
    const list = alltraRpcEndpoints('https://mainnet-rpc.alltra.global/')
    expect(list[0]).toBe('https://mainnet-rpc.alltra.global')
    expect(list).toContain('https://alltra.global/api/eth-rpc')
    expect(list).toContain('https://alltra-rpc.novablockchainsystem.com')
    expect(new Set(list).size).toBe(list.length)
  })
})

describe('isAlltraRpcTransportError', () => {
  it('detects 502 / SERVER_ERROR / unreachable', () => {
    expect(isAlltraRpcTransportError(new Error('SERVER_ERROR'))).toBe(true)
    expect(isAlltraRpcTransportError(new Error('502 Bad Gateway'))).toBe(true)
    expect(
      isAlltraRpcTransportError(new Error('Alltra RPC unreachable (tried 2 endpoints)')),
    ).toBe(true)
  })

  it('does not treat liquidity reverts as transport', () => {
    expect(isAlltraRpcTransportError(new Error('execution reverted'))).toBe(false)
    expect(isAlltraRpcTransportError(new Error('No on-chain liquidity for path'))).toBe(false)
  })
})
