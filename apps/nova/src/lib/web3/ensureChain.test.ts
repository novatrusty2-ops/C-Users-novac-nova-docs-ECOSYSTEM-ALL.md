import { describe, expect, it, vi } from 'vitest'
import {
  ensureWalletChain,
  toHexChainId,
  toWalletAddEthereumChainParam,
  WEB3_SWITCHABLE_CHAIN_IDS,
} from './ensureChain'
import type { Eip1193Provider } from './types'
import { getChain } from '../chains'

describe('ensureWalletChain', () => {
  it('encodes chain 138 as 0x8a for wallet_addEthereumChain', () => {
    expect(toHexChainId(138)).toBe('0x8a')
    const chain = getChain(138)!
    const param = toWalletAddEthereumChainParam(chain)
    expect(param.chainId).toBe('0x8a')
    expect(param.chainName).toBe('DeFi Oracle')
    expect(param.nativeCurrency.symbol).toBe('ETH')
    expect(param.rpcUrls[0]).toContain('defi-oracle')
    expect(param.blockExplorerUrls?.[0]).toContain('explorer.defi-oracle.io')
    expect(param.blockExplorerUrls?.every((u) => !u.includes('etherscan.io'))).toBe(true)
  })

  it('includes production mesh chains for Web3 switch', () => {
    expect(WEB3_SWITCHABLE_CHAIN_IDS).toEqual(
      expect.arrayContaining([22016, 33001, 138, 1, 56]),
    )
  })

  it('switches when wallet already knows the chain', async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === 'wallet_switchEthereumChain') return null
      throw new Error(`unexpected ${method}`)
    })
    const provider = { request } as Eip1193Provider
    await expect(ensureWalletChain(provider, 138)).resolves.toBe(138)
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x8a' }],
    })
  })

  it('adds chain on unrecognized (4902) then switches', async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === 'wallet_switchEthereumChain') {
        const err = new Error('Unrecognized chain') as Error & { code: number }
        err.code = 4902
        throw err
      }
      if (method === 'wallet_addEthereumChain') return null
      throw new Error(`unexpected ${method}`)
    })
    // First switch throws 4902; after add, second switch succeeds
    let switches = 0
    request.mockImplementation(async ({ method }: { method: string }) => {
      if (method === 'wallet_switchEthereumChain') {
        switches += 1
        if (switches === 1) {
          const err = new Error('Unrecognized chain') as Error & { code: number }
          err.code = 4902
          throw err
        }
        return null
      }
      if (method === 'wallet_addEthereumChain') return null
      throw new Error(`unexpected ${method}`)
    })
    const provider = { request } as Eip1193Provider
    await expect(ensureWalletChain(provider, 138)).resolves.toBe(138)
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'wallet_addEthereumChain' }),
    )
    const addCall = request.mock.calls.find(
      (c) => (c[0] as { method: string }).method === 'wallet_addEthereumChain',
    )
    const payload = addCall?.[0] as {
      method: string
      params?: Array<{ chainId: string; chainName: string }>
    }
    expect(payload.params?.[0]).toMatchObject({ chainId: '0x8a', chainName: 'DeFi Oracle' })
  })
})
