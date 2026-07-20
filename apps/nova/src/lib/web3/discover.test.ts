import { describe, expect, it } from 'vitest'
import { WALLET_CATALOG } from './catalog'
import { walletIdFromProvider } from './discover'
import type { Eip1193Provider } from './types'
import { toHexChainId } from './ensureChain'

describe('web3 wallet catalog', () => {
  it('includes MetaMask, Trust, SafePal, Gate and injected', () => {
    const ids = WALLET_CATALOG.map((w) => w.id)
    expect(ids).toContain('metamask')
    expect(ids).toContain('trust')
    expect(ids).toContain('safepal')
    expect(ids).toContain('gate')
    expect(ids).toContain('injected')
    expect(ids).toContain('walletconnect')
  })

  it('documents production injected wallets ahead of WalletConnect stub', () => {
    const wc = WALLET_CATALOG.find((w) => w.id === 'walletconnect')
    expect(wc?.subtitle.toLowerCase()).toContain('injected')
    expect(toHexChainId(138)).toBe('0x8a')
  })

  it('detects MetaMask flag', () => {
    const p = { request: async () => [], isMetaMask: true } as Eip1193Provider
    expect(walletIdFromProvider(p)).toBe('metamask')
  })

  it('detects Trust flag', () => {
    const p = { request: async () => [], isTrust: true } as Eip1193Provider
    expect(walletIdFromProvider(p)).toBe('trust')
  })

  it('detects SafePal and Gate flags', () => {
    expect(walletIdFromProvider({ request: async () => [], isSafePal: true })).toBe('safepal')
    expect(walletIdFromProvider({ request: async () => [], isGateWallet: true })).toBe('gate')
  })
})
